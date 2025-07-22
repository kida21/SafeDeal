package consul

import (
    "fmt"
    "log"
    "github.com/hashicorp/consul/api"
)

var client *api.Client

func InitConsul() {
    config := api.DefaultConfig()
    config.Address = "consul:8500"
    config.Scheme = "http"

    var err error
    client, err = api.NewClient(config)
    if err != nil {
        log.Fatalf("Failed to connect to Consul: %v", err)
    }
}
func GetServiceEndpoint(serviceName string) (string, error) {
    services, meta, err := client.Catalog().Service(serviceName, "", nil)
    if err != nil || meta.LastIndex == 0 || len(services) == 0 {
        return "", fmt.Errorf("service not found in Consul: %s", serviceName)
    }

    service := services[0]
    return fmt.Sprintf("%s:%d", service.ServiceAddress, service.ServicePort), nil
}