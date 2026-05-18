package com.meditrack.back.app;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.datasource.driverClassName=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "cloudinary.cloud_name=test",
    "cloudinary.api_key=test",
    "cloudinary.api_secret=test"
})
class LogitrackApplicationTests {

    @Test
    void contextLoads() {
    }

}