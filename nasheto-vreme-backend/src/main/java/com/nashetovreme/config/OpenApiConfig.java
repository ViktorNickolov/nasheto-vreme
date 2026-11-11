package com.nashetovreme.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI().info(new Info()
                .title("Nasheto Vreme API")
                .version("v1")
                .description("Foundation API for Nasheto Vreme")
                .contact(new Contact().name("Nasheto Vreme Team")));
    }
}

