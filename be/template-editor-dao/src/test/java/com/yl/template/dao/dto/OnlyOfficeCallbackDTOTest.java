package com.yl.template.dao.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertNotNull;

public class OnlyOfficeCallbackDTOTest {
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    public void testDeserializeHistoryObject() throws Exception {
        String json = "{\"status\": 2, \"key\": \"test-key\", \"history\": {\"serverVersion\": \"7.3.0\", \"changes\": []}}";
        OnlyOfficeCallbackDTO dto = objectMapper.readValue(json, OnlyOfficeCallbackDTO.class);
        assertNotNull(dto.getHistory());
    }
}
