package com.yl.template.dao.dto;

import lombok.Data;
import java.io.Serializable;
import java.util.List;
import java.util.Map;

/**
 * OnlyOffice 回调请求 DTO
 * 详细参考：https://api.onlyoffice.com/editors/callback
 */
@Data
public class OnlyOfficeCallbackDTO implements Serializable {

    /**
     * 只有编辑器状态
     * 1 - 正在编辑
     * 2 - 文件已准备好保存（用户关闭编辑器后触发）
     * 3 - 发生文档保存错误
     * 4 - 文档未修改（用户关闭编辑器且未保存时触发）
     * 6 - 强制保存（调用 forcesave API 时触发）
     * 7 - 发生强制保存错误
     */
    private Integer status;

    /**
     * 已保存文档的下载地址（仅在 status 2 或 6 时存在）
     */
    private String url;

    /**
     * 文档的唯一标识符（key）
     */
    private String key;

    /**
     * 正在编辑该文档的用户列表
     */
    private List<String> users;

    /**
     * 用户执行的操作列表
     */
    private List<Map<String, Object>> actions;

    /**
     * 上一次保存的时间戳
     */
    private String lastsave;

    /**
     * 文档是否未修改
     */
    private Boolean notmodified;

    /**
     * 用于恢复文档的 URL（如果保存失败）
     */
    private String changesurl;

    /**
     * 历史记录 JSON（如果启用版本历史）
     */
    private Map<String, Object> history;

    /**
     * 更改日志
     */
    private String userdata;
}