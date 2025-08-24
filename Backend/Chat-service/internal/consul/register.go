package consul

import (
	"fmt"
    "log"
    "github.com/hashicorp/consul/api"
)

func RegisterService(serviceName, serviceID string, port int) {
    config := api.DefaultConfig()
    config.Address = "consul:8500"

    client, err := api.NewClient(config)
    if err != nil {
        log.Fatalf("Failed to create Consul client: %v", err)
    }

    reg := &api.AgentServiceRegistration{
        ID:      serviceID,
        Name:    serviceName,
        Port:    port,
        Address: serviceID,
        Check: &api.AgentServiceCheck{
            HTTP:     "http://" + serviceID + ":" + fmt.Sprintf("%d", port) + "/health",
            Interval: "10s",
            Timeout:  "5s",
        },
    }

    if err := client.Agent().ServiceRegister(reg); err != nil {
        log.Fatalf("Failed to register service with Consul: %v", err)
    }

    log.Printf("✅ Registered %s with Consul", serviceName)
}