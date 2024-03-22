require('dotenv').config();

const { DefaultAzureCredential } = require('@azure/identity');
const { ComputeManagementClient } = require('@azure/arm-compute');
const { ResourceManagementClient } = require('@azure/arm-resources');
const { NetworkManagementClient } = require('@azure/arm-network');
const { setLogLevel } = require("@azure/logger");

// Set logging level
setLogLevel("info");

// Azure Credentials setup
const tenantId = process.env.AZURE_TENANT_ID;
const clientId = process.env.AZURE_CLIENT_ID;
const clientSecret = process.env.AZURE_CLIENT_SECRET;
const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
const adminUsername = process.env.VM_ADMIN_USERNAME || 'defaultAdminUsername';
const adminPassword = process.env.VM_ADMIN_PASSWORD || 'defaultAdminPassword123!';

// Initialize Azure credentials and clients
const credentials = new DefaultAzureCredential({ tenantId, clientId, clientSecret });
const resourceClient = new ResourceManagementClient(credentials, subscriptionId);
const computeClient = new ComputeManagementClient(credentials, subscriptionId);
const networkClient = new NetworkManagementClient(credentials, subscriptionId);

// VM image information for various OS
const vmImages = {
  ubuntu: { publisher: 'Canonical', offer: 'UbuntuServer', sku: '18.04-LTS', version: 'latest' },
  debian: { publisher: 'Debian', offer: 'debian-11', sku: '11', version: 'latest' },
  windows: { publisher: 'MicrosoftWindowsServer', offer: 'WindowsServer', sku: '2019-Datacenter', version: 'latest' }
};

// Generates a unique VM name based on the base name and VM type
function generateVMName(baseName, vmType) {
    const timestamp = Date.now().toString();
    const isWindows = vmType === 'windows';
    let name = `${baseName}-${timestamp.slice(-6)}`;
    if (isWindows) {
        name = name.length > 15 ? name.slice(0, 15) : name;
    }
    return name;
}

async function createPublicIP(resourceGroupName, location, publicIpName) {
    console.log(`Creating public IP: ${publicIpName}`);
    const publicIpParameters = {
        location: location,
        publicIPAllocationMethod: 'Dynamic',
        idleTimeoutInMinutes: 4,
        sku: { name: 'Basic' },
    };
    await networkClient.publicIPAddresses.beginCreateOrUpdateAndWait(resourceGroupName, publicIpName, publicIpParameters);
    console.log(`Public IP ${publicIpName} created successfully.`);
    return `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Network/publicIPAddresses/${publicIpName}`;
}


async function getPublicIPAddress(resourceGroupName, publicIpName) {
    const publicIP = await networkClient.publicIPAddresses.get(resourceGroupName, publicIpName);
    return publicIP.ipAddress;
}

// Creates a new Azure resource group
async function createResourceGroup(location) {
    const resourceGroupName = `MyResourceGroup-${Date.now()}`;
    console.log(`Creating resource group: ${resourceGroupName} in ${location}`);
    await resourceClient.resourceGroups.createOrUpdate(resourceGroupName, { location });
    console.log(`Resource group ${resourceGroupName} created successfully.`);
    return resourceGroupName; // Retourne le nom unique pour utilisation dans les autres fonctions
}

// Creates a Virtual Network and a Subnet
async function createVNetAndSubnet(resourceGroupName, location, vnetName, subnetName) {
    await networkClient.virtualNetworks.beginCreateOrUpdateAndWait(resourceGroupName, vnetName, {
        location,
        addressSpace: { addressPrefixes: ['10.0.0.0/16'] },
        subnets: [{ name: subnetName, addressPrefix: '10.0.1.0/24' }]
    });
    console.log('VNet and Subnet created successfully.');
}

// Creates a network interface
async function createNetworkInterface(resourceGroupName, location, networkInterfaceName, subnetId, publicIpAddressId) {
    const nicParameters = {
        location: location,
        ipConfigurations: [{
            name: `${networkInterfaceName}-ipConfig`,
            subnet: { id: subnetId },
            publicIPAddress: { id: publicIpAddressId }, // Ajoutez ceci
        }]
    };
    await networkClient.networkInterfaces.beginCreateOrUpdateAndWait(resourceGroupName, networkInterfaceName, nicParameters);
    console.log('Network interface created successfully.');
}

async function createVM(vmType, resourceGroupName, location, vmName, nicId) {
    const imageRef = vmImages[vmType];
    if (!imageRef) {
        throw new Error('Type of VM is invalid');
    }

    const vmParameters = {
        location,
        hardwareProfile: { vmSize: 'Standard_B1s' },
        storageProfile: { imageReference: imageRef, osDisk: { createOption: 'fromImage' } },
        osProfile: { computerName: vmName, adminUsername, adminPassword },
        networkProfile: { networkInterfaces: [{ id: nicId, primary: true }] }
    };

    const result = await computeClient.virtualMachines.beginCreateOrUpdateAndWait(resourceGroupName, vmName, vmParameters);
    console.log(`VM ${vmName} created successfully.`);

    // Planifiez la suppression de la VM après 10 minutes
    setTimeout(async () => {
        console.log(`Initiating deletion for VM: ${vmName}`);
        await deleteResourceGroupAndResources(resourceGroupName);
    }, 600000); // 10 minutes

    return result;
}

// Sets up and creates a VM
async function setupAndCreateVM(vmType, res) {
    const location = "francecentral";
    const vnetName = "MonVNet";
    const subnetName = "MonSubnet";
    const uniqueName = generateVMName("cloudPortal", vmType);
    const networkInterfaceName = `${uniqueName}-nic`;

    try {
        const resourceGroupName = await createResourceGroup(location);
        await createVNetAndSubnet(resourceGroupName, location, vnetName, subnetName);
        const subnetId = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Network/virtualNetworks/${vnetName}/subnets/${subnetName}`;
        const publicIpName = `${uniqueName}-publicIp`;
        const publicIpAddressId = await createPublicIP(resourceGroupName, location, publicIpName);
        await createNetworkInterface(resourceGroupName, location, networkInterfaceName, subnetId, publicIpAddressId);

        const nicId = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Network/networkInterfaces/${networkInterfaceName}`;
        await createVM(vmType, resourceGroupName, location, uniqueName, nicId);


        const ipAddress = await getPublicIPAddress(resourceGroupName, publicIpName);
        
        // Préparez ici les informations de connexion selon le type de VM
        let connectionInfo;
        if (vmType === 'windows') {
            connectionInfo = {
                method: 'RDP',
                ipAddress,
                username: adminUsername,
                password: adminPassword,
            };
        } else { // supposant linux
            connectionInfo = {
                method: 'SSH',
                ipAddress,
                username: adminUsername,
                password: adminPassword,
                command: `ssh ${adminUsername}@${ipAddress}`,
            };

            console.log( "vm ====>>> "+connectionInfo)
        }
          return {
            message: "VM créée avec succès.",
            connectionInfo
        };
    } catch (error) {
        console.error("Errors in VM configuration:", error);
        res.status(500).send('Error of creation azure resources.');
    }
}
// Deletes a VM, its associated resources, and the resource group
async function deleteResourceGroupAndResources(resourceGroupName) {
    try {
        console.log(`Initiating deletion for resource group: ${resourceGroupName}`);
        await resourceClient.resourceGroups.beginDeleteAndWait(resourceGroupName);
        console.log(`Resource group ${resourceGroupName} has been deleted.`);
    } catch (error) {
        console.error(`Error deleting resource group ${resourceGroupName}:`, error);
    }
}

module.exports = {
    setupAndCreateVM,
    deleteResourceGroupAndResources
}
