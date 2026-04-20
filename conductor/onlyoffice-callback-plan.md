# OnlyOffice Callback History Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve the deserialization error for the `history` field in the OnlyOffice callback by changing its type to `Map<String, Object>`.

**Architecture:** Update the DTO field type in the DAO module to match the JSON object structure sent by OnlyOffice Document Server.

**Tech Stack:** Java, Spring Boot, Jackson, Lombok

---

### Task 1: Create Unit Test to Reproduce Failure

**Files:**
- Create: `be/template-editor-dao/src/test/java/com/yl/template/dao/dto/OnlyOfficeCallbackDTOTest.java`

- [ ] **Step 1: Write the failing test**

```java
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `mvn test -pl template-editor-dao -Dtest=OnlyOfficeCallbackDTOTest`
Expected: FAIL with `HttpMessageNotReadableException` (or `MismatchedInputException`)

### Task 2: Modify OnlyOfficeCallbackDTO

**Files:**
- Modify: `be/template-editor-dao/src/main/java/com/yl/template/dao/dto/OnlyOfficeCallbackDTO.java`

- [ ] **Step 1: Update history field type**

Change line 64:
```java
    /**
     * 历史记录 JSON（如果启用版本历史）
     */
    private Map<String, Object> history;
```

- [ ] **Step 2: Run test to verify it passes**

Run: `mvn test -pl template-editor-dao -Dtest=OnlyOfficeCallbackDTOTest`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add be/template-editor-dao/src/main/java/com/yl/template/dao/dto/OnlyOfficeCallbackDTO.java be/template-editor-dao/src/test/java/com/yl/template/dao/dto/OnlyOfficeCallbackDTOTest.java
git commit -m "fix: change OnlyOfficeCallbackDTO history field to Map to handle object payload"
```
