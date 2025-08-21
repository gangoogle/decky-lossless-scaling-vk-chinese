import { PanelSectionRow, ToggleField, SliderField, ButtonItem } from "@decky/ui";
import { useState, useEffect } from "react";
import { RiArrowDownSFill, RiArrowUpSFill } from "react-icons/ri";
import { ConfigurationData } from "../config/configSchema";
import { FpsMultiplierControl } from "./FpsMultiplierControl";
import {
  FLOW_SCALE, PERFORMANCE_MODE, HDR_MODE, 
  EXPERIMENTAL_PRESENT_MODE, DXVK_FRAME_RATE, DISABLE_STEAMDECK_MODE,
  MANGOHUD_WORKAROUND, DISABLE_VKBASALT, FORCE_ENABLE_VKBASALT, ENABLE_WSI
} from "../config/generatedConfigSchema";

interface ConfigurationSectionProps {
  config: ConfigurationData;
  onConfigChange: (fieldName: keyof ConfigurationData, value: boolean | number | string) => Promise<void>;
}

const WORKAROUNDS_COLLAPSED_KEY = 'lsfg-workarounds-collapsed';

export function ConfigurationSection({
  config,
  onConfigChange
}: ConfigurationSectionProps) {
  // Initialize with localStorage value, fallback to true if not found
  const [workaroundsCollapsed, setWorkaroundsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem(WORKAROUNDS_COLLAPSED_KEY);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Persist workarounds collapse state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(WORKAROUNDS_COLLAPSED_KEY, JSON.stringify(workaroundsCollapsed));
    } catch (error) {
      console.warn('Failed to save workarounds collapse state:', error);
    }
  }, [workaroundsCollapsed]);

  return (
    <>
      <style>
        {`
        .LSFG_WorkaroundsCollapseButton_Container > div > div > div > button {
          height: 10px !important;
        }
        .LSFG_WorkaroundsCollapseButton_Container > div > div > div > div > button {
          height: 10px !important;
        }
        `}
      </style>

      {/* 帧生成倍数 */}
      <FpsMultiplierControl config={config} onConfigChange={onConfigChange} />

      <PanelSectionRow>
        <SliderField
          label={`流动缩放 (${Math.round(config.flow_scale * 100)}%)`}
          description="降低内部运动估算分辨率，略微提升性能"
          value={config.flow_scale}
          min={0.25}
          max={1.0}
          step={0.01}
          onChange={(value) => onConfigChange(FLOW_SCALE, value)}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <SliderField
          label={`基础帧率上限${config.dxvk_frame_rate > 0 ? ` (${config.dxvk_frame_rate} FPS)` : ' (关闭)'}`}
          description="DirectX 游戏的基础帧率上限，应用于帧生成倍数前。（需重启游戏生效）"
          value={config.dxvk_frame_rate}
          min={0}
          max={60}
          step={1}
          onChange={(value) => onConfigChange(DXVK_FRAME_RATE, value)}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <ToggleField
          label={`呈现模式（${(config.experimental_present_mode || "fifo") === "fifo" ? "FIFO" : "Mailbox"}）`}
          description="在 FIFO - 垂直同步（默认）和 Mailbox 呈现模式间切换，以获得更好的性能或兼容性"
          checked={(config.experimental_present_mode || "fifo") === "fifo"}
          onChange={(value) => onConfigChange(EXPERIMENTAL_PRESENT_MODE, value ? "fifo" : "mailbox")}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <ToggleField
          label="性能模式"
          description="使用更轻量的帧生成模型（推荐大多数游戏使用）"
          checked={config.performance_mode}
          onChange={(value) => onConfigChange(PERFORMANCE_MODE, value)}
        />
      </PanelSectionRow>

      {/* <PanelSectionRow>
        <ToggleField
          label="强制禁用 FP16"
          description="强制禁用 FP16 加速"
          checked={config.no_fp16}
          onChange={(value) => onConfigChange(NO_FP16, value)}
        />
      </PanelSectionRow> */}

      <PanelSectionRow>
        <ToggleField
          label="HDR 模式"
          description={config.enable_wsi ? "启用 HDR 模式（仅支持 HDR 的游戏可用）" : "请在下方兼容性选项中启用 WSI 以解锁 HDR 开关"}
          checked={config.hdr_mode}
          disabled={!config.enable_wsi}
          onChange={(value) => onConfigChange(HDR_MODE, value)}
        />
      </PanelSectionRow>

      {/* 兼容性与修复选项 */}
      <PanelSectionRow>
        <div
          style={{
            fontSize: "14px",
            fontWeight: "bold",
            marginTop: "16px",
            marginBottom: "8px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
            paddingBottom: "4px",
            color: "white"
          }}
        >
          兼容性与修复选项
        </div>
      </PanelSectionRow>

      <PanelSectionRow>
        <div className="LSFG_WorkaroundsCollapseButton_Container">
          <ButtonItem
            layout="below"
            bottomSeparator={workaroundsCollapsed ? "standard" : "none"}
            onClick={() => setWorkaroundsCollapsed(!workaroundsCollapsed)}
          >
            {workaroundsCollapsed ? (
              <RiArrowDownSFill
                style={{ transform: "translate(0, -13px)", fontSize: "1.5em" }}
              />
            ) : (
              <RiArrowUpSFill
                style={{ transform: "translate(0, -12px)", fontSize: "1.5em" }}
              />
            )}
          </ButtonItem>
        </div>
      </PanelSectionRow>

      {!workaroundsCollapsed && (
        <>
        <PanelSectionRow>
            <ToggleField
              label="启用 WSI"
              description="重新启用 Gamescope WSI 层。需重启游戏生效。-Valve 用 Vulkan 写的“迷你合成器”+“WSI 扩展”，让 SteamOS/Deck 在 Wayland 里零拷贝、低延迟、高帧率跑游戏"
              checked={config.enable_wsi}
              disabled={config.hdr_mode}
              onChange={(value) => {
                if (!value && config.hdr_mode) {
                  // 关闭 WSI 时自动关闭 HDR
                  onConfigChange(HDR_MODE, false);
                }
                onConfigChange(ENABLE_WSI, value);
              }}
            />
          </PanelSectionRow>
          
          <PanelSectionRow>
            <ToggleField
              label="为 32 位游戏启用 WOW64"
              description="为 32 位游戏启用 PROTON_USE_WOW64=1（配合 ProtonGE 可修复部分崩溃）"
              checked={config.enable_wow64}
              onChange={(value) => onConfigChange('enable_wow64', value)}
            />
          </PanelSectionRow>

          <PanelSectionRow>
            <ToggleField
              label="禁用 Steam Deck 模式"
              description="禁用 Steam Deck 模式（可解锁部分游戏隐藏设置）"
              checked={config.disable_steamdeck_mode}
              onChange={(value) => onConfigChange(DISABLE_STEAMDECK_MODE, value)}
            />
          </PanelSectionRow>

          <PanelSectionRow>
            <ToggleField
              label="MangoHud 兼容修复"
              description="启用透明 MangoHud 叠加层，有时可修复游戏模式下 2X 倍数问题-第三方的fps监控工具-非常有用如果x2倍率开启无效一定要试试这个"
              checked={config.mangohud_workaround}
              onChange={(value) => onConfigChange(MANGOHUD_WORKAROUND, value)}
            />
          </PanelSectionRow>

          <PanelSectionRow>
            <ToggleField
              label="禁用 vkBasalt"
              description="禁用 vkBasalt 层，避免与 LSFG 冲突（如 Reshade、部分 Decky 插件）"
              checked={config.disable_vkbasalt}
              disabled={config.force_enable_vkbasalt}
              onChange={(value) => {
                if (value && config.force_enable_vkbasalt) {
                  // 启用禁用时自动关闭强制启用
                  onConfigChange(FORCE_ENABLE_VKBASALT, false);
                }
                onConfigChange(DISABLE_VKBASALT, value);
              }}
            />
          </PanelSectionRow>

          <PanelSectionRow>
            <ToggleField
              label="强制启用 vkBasalt"
              description="强制启用 vkBasalt 以修复游戏模式下帧率问题"
              checked={config.force_enable_vkbasalt}
              disabled={config.disable_vkbasalt}
              onChange={(value) => {
                if (value && config.disable_vkbasalt) {
                  // 启用强制启用时自动关闭禁用
                  onConfigChange(DISABLE_VKBASALT, false);
                }
                onConfigChange(FORCE_ENABLE_VKBASALT, value);
              }}
            />
          </PanelSectionRow>
        </>
      )}
    </>
  );
}
