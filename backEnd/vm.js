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

// Creates a new Azure resource group
async function createResourceGroup(location) {
    const resourceGroupName = `MyResourceGroup-${Date.now()}`;
    console.log(`Creating resource group: ${resourceGroupName} in ${location}`);
    await resourceClient.resourceGroups.createOrUpdate(resourceGroupName, { location });
    console.log(`Resource group ${resourceGroupName} created successfully.`);
    return resourceGroupName;
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
async function createNetworkInterface(resourceGroupName, location, networkInterfaceName, subnetId) {
    const nicParameters = {
        location: location,
        ipConfigurations: [{ name: `${networkInterfaceName}-ipConfig`, subnet: { id: subnetId } }]
    };
    await networkClient.networkInterfaces.beginCreateOrUpdateAndWait(resourceGroupName, networkInterfaceName, nicParameters);
    console.log('Network interface created successfully.');
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
        await createNetworkInterface(resourceGroupName, location, networkInterfaceName, subnetId);

        const nicId = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Network/networkInterfaces/${networkInterfaceName}`;
        await createVM(vmType, resourceGroupName, location, uniqueName, nicId, res);
    } catch (error) {
        console.error("Errors in VM configuration:", error);
        res.status(500).send('Error of creation azure resources.');
    }
}

// Creates a virtual machine
async function createVM(vmType, resourceGroupName, location, vmName, nicId, res) {
    const imageRef = vmImages[vmType];
    if (!imageRef) {
        return res.status(400).send('Type of VM is invalid');
    }

    const vmParameters = {
        location,
        hardwareProfile: { vmSize: 'Standard_B1s' },
        storageProfile: { imageReference: imageRef, osDisk: { createOption: 'fromImage' } },
        osProfile: { computerName: vmName, adminUsername, adminPassword },
        networkProfile: { networkInterfaces: [{ id: nicId, primary: true }] }
    };

    try {
        const result = await computeClient.virtualMachines.beginCreateOrUpdateAndWait(resourceGroupName, vmName, vmParameters);
        console.log(`VM ${vmName} created successfully.`);
        // Logic to delete the VM after a specified time
        setTimeout(async () => {
            console.log(`Initiating deletion for VM: ${vmName}`);
            await deleteVMAndAssociatedResources(resourceGroupName, vmName, nicId);
        }, 600000); // 10 minutes
        res.status(201).send(result);
    } catch (error) {
        console.error(`Error creating VM of type ${vmType}:`, error);
        res.status(500).send('Error of creating VM');
    }
}

// Deletes a VM and its associated resources
async function deleteVMAndAssociatedResources(resourceGroupName, vmName, nicId) {
    try {
        console.log(`Deleting VM: ${vmName}`);
        await computeClient.virtualMachines.beginDeleteAndWait(resourceGroupName, vmName);
        console.log(`Deleting NIC: ${nicId}`);
        await networkClient.networkInterfaces.beginDeleteAndWait(resourceGroupName, nicId.split('/').pop());
        console.log(`All associated resources for VM: ${vmName} have been deleted.`);
    } catch (error) {
        console.error(`Error deleting resources for VM: ${vmName}`, error);
    }
}

module.exports = {
    setupAndCreateVM,
    deleteVMAndAssociatedResources
};
