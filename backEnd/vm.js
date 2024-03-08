require('dotenv').config();

const { DefaultAzureCredential } = require('@azure/identity');
const { ComputeManagementClient } = require('@azure/arm-compute');
const { NetworkManagementClient } = require('@azure/arm-network');

const { setLogLevel } = require("@azure/logger");

setLogLevel("info");

// Azure Credentials
const tenantId = process.env.AZURE_TENANT_ID;
const clientId = process.env.AZURE_CLIENT_ID;
const clientSecret = process.env.AZURE_CLIENT_SECRET;
const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;

const resourceGroupName = process.env.AZURE_RESOURCE_GROUP || "ressourceForCloudPortal";

const adminUsername = process.env.VM_ADMIN_USERNAME || 'defaultAdminUsername';
const adminPassword = process.env.VM_ADMIN_PASSWORD || 'defaultAdminPassword123!';

// Initialize Azure credentials and compute client
const credentials = new DefaultAzureCredential({ tenantId, clientId, clientSecret });
const computeClient = new ComputeManagementClient(credentials, subscriptionId);

const networkClient = new NetworkManagementClient(credentials, subscriptionId);

// VM images information
const vmImages = {
  linux: {
    publisher: 'Canonical',
    offer: 'UbuntuServer',
    sku: '18.04-LTS',
    version: 'latest'
  },
  debian: {
    publisher: 'credativ',
    offer: 'Debian',
    sku: '10',
    version: 'latest'
  },
  windows: {
    publisher: 'MicrosoftWindowsServer',
    offer: 'WindowsServer',
    sku: '2019-Datacenter',
    version: 'latest'
  }
};

// Generate a unique VM name
function generateVMName(baseName) {
  const timestamp = Date.now();
  return `${baseName}-${timestamp}`;
}

// create Vnet and Subnet
async function createVNetAndSubnet(resourceGroupName, location, vnetName, subnetName) {
  await networkClient.virtualNetworks.beginCreateOrUpdateAndWait(resourceGroupName, vnetName, {
    location,
    addressSpace: {
      addressPrefixes: ['10.0.0.0/16'],
    },
    subnets: [{ name: subnetName, addressPrefix: '10.0.1.0/24' }],
  });

  console.log('Vnet and Subnet created succefully');
}

// create network interface
async function createNetworkInterface(resourceGroupName, location, networkInterfaceName, subnetId) {
  const nicParameters = {
    location: location,
    ipConfigurations: [
      {
        name: `${networkInterfaceName}-ipConfig`,
        subnet: { id: subnetId },
      },
    ],
  };

  await networkClient.networkInterfaces.beginCreateOrUpdateAndWait(resourceGroupName, networkInterfaceName, nicParameters);

  console.log('NIC created succesfully');
}


async function setupAndCreateVM(vmType, res) {
  const location = "francecentral";
  const vnetName = "MonVNet";
  const subnetName = "MonSubnet";
  const vnetAddressPrefix = "10.0.0.0/16";
  const subnetAddressPrefix = "10.0.1.0/24";
  
  // unique name 
  const uniqueName = generateVMName(`cloudPortal-${vmType}`);
  const networkInterfaceName = `${uniqueName}-nic`;

  try {
    // step 1: create VNet and Subnet
    console.log("Creation of VNet and Subnet...");
    await createVNetAndSubnet(resourceGroupName, location, vnetName, subnetName);
    const subnetId = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Network/virtualNetworks/${vnetName}/subnets/${subnetName}`;

    // step 2: create NIC
    console.log("Creation of NIC");
    await createNetworkInterface(resourceGroupName, location, networkInterfaceName, subnetId);

    // ID of NIC
    const nicId = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Network/networkInterfaces/${networkInterfaceName}`;

    // step 3 : create  a VM
    console.log("Creation of virtual machine..");
    await createVM(vmType, location, uniqueName, nicId, res);
  } catch (error) {
    console.error("erros in configuration of VM :", error);
    res.status(500).send('Error of creation azure resources.');
  }
}

async function createVM(vmType, location, vmName, nicId, res) {
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
    console.log(`VM created succesfully : ${vmName}`);
         setTimeout(async () => {
        console.log(`Starting to delete VM: ${vmName} after 10 minutes.`);
        await deleteVMAndAssociatedResources(resourceGroupName, vmName, nicId); // Enhanced to delete associated resources
        console.log(`Deletion process initiated for VM: ${vmName}`);
    }, 600000);
   
    res.status(201).send(result);
  } catch (error) {
    console.error(`Error of creatinn VM : ${vmType}`, error);
    res.status(500).send('Error of creating VM');
  }
}


async function deleteVMAndAssociatedResources(resourceGroupName, vmName, nicId) {
    try {
        // Delete VM
        console.log(`Deleting VM: ${vmName}`);
        await computeClient.virtualMachines.beginDeleteAndWait(resourceGroupName, vmName);

        // Delete NIC
        console.log(`Deleting NIC: ${nicId}`);
        await networkClient.networkInterfaces.beginDeleteAndWait(resourceGroupName, nicId.split('/').pop());

        // If there are other resources like disks or public IP you created separately and want to delete, add those deletions here.
        // Example for deleting OS disk (assuming disk name is known or retrieved earlier):
        // console.log(`Deleting OS Disk: ${osDiskName}`);
        // await diskClient.disks.beginDeleteAndWait(resourceGroupName, osDiskName);

        console.log(`All associated resources for VM: ${vmName} have been deleted.`);
    } catch (error) {
        console.error(`Error deleting resources for VM: ${vmName}`, error);
    }
}

module.exports = {
  setupAndCreateVM,
  deleteVMAndAssociatedResources
};

