# Basic Terraform script to provision an Azure Resource Group (demo only)
provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "clubverse_rg" {
  name     = "clubverse-rg"
  location = "East US"
}
