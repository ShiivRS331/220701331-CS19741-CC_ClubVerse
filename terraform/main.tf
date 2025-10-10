# Basic Terraform script to provision an Azure Resource Group (demo only)
provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "clubverse_rg" {
  name     = "clubverse-rg"
  location = "East US"
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "main" {
  name     = "clubverse-rg"
  location = "West US 2"
}

resource "azurerm_container_app_environment" "main" {
  name                = "clubverse-env"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
}

resource "azurerm_container_app" "server" {
  name                         = "clubverse-server"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"

  template {
    container {
      name   = "server"
      image  = "shiivrs331/clubverse:server"
      cpu    = 0.5
      memory = "1.0Gi"

      env {
        name  = "GEMINI_API_KEY"
        secret_name = "gemini-api-key"
      }

      env {
        name  = "PORT"
        value = "5000"
      }
    }

    secret {
      name  = "gemini-api-key"
      value = var.gemini_api_key
    }
  }

  ingress {
    external_enabled = true
    target_port      = 5000
    transport        = "auto"
  }
}

variable "gemini_api_key" {
  description = "Gemini API Key"
  type        = string
  sensitive   = true
}
