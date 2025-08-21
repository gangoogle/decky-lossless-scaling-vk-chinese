import React, { useState, useEffect } from 'react';
import {
  ButtonItem,
  PanelSection,
  PanelSectionRow,
  Field,
  Focusable
} from '@decky/ui';
import { checkForPluginUpdate, downloadPluginUpdate, UpdateCheckResult, UpdateDownloadResult } from '../api/lsfgApi';

interface PluginUpdateCheckerProps {
  // Add any props if needed
}

interface UpdateInfo {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseNotes: string;
  releaseDate: string;
  downloadUrl: string;
}

export const PluginUpdateChecker: React.FC<PluginUpdateCheckerProps> = () => {
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [downloadingUpdate, setDownloadingUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [downloadResult, setDownloadResult] = useState<UpdateDownloadResult | null>(null);

  // Auto-hide error messages after 5 seconds
  useEffect(() => {
    if (updateError) {
      const timer = setTimeout(() => {
        setUpdateError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [updateError]);

  const handleCheckForUpdate = async () => {
    setCheckingUpdate(true);
    setUpdateError(null);
    setUpdateInfo(null);
    setDownloadResult(null); // Clear previous download result

    try {
      const result: UpdateCheckResult = await checkForPluginUpdate();
      
      if (result.success) {
        setUpdateInfo({
          updateAvailable: result.update_available,
          currentVersion: result.current_version,
          latestVersion: result.latest_version,
          releaseNotes: result.release_notes,
          releaseDate: result.release_date,
          downloadUrl: result.download_url
        });

        // Simple console log instead of toast since showToast may not be available
        if (result.update_available) {
          console.log("Update available!", `Version ${result.latest_version} is now available.`);
        } else {
          console.log("Up to date!", "You have the latest version installed.");
        }
      } else {
        setUpdateError(result.error || "Failed to check for updates");
      }
    } catch (error) {
      setUpdateError(`Error checking for updates: ${error}`);
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleDownloadUpdate = async () => {
    if (!updateInfo?.downloadUrl) return;

    setDownloadingUpdate(true);
    setUpdateError(null);
    setDownloadResult(null);

    try {
      const result: UpdateDownloadResult = await downloadPluginUpdate(updateInfo.downloadUrl);
      
      if (result.success) {
        setDownloadResult(result);
        console.log("✓ Download complete!", `Plugin downloaded to ${result.download_path}`);
      } else {
        setUpdateError(result.error || "Failed to download update");
      }
    } catch (error) {
      setUpdateError(`Error downloading update: ${error}`);
    } finally {
      setDownloadingUpdate(false);
    }
  };

  const getStatusMessage = () => {
    if (!updateInfo) return null;

    if (updateInfo.updateAvailable) {
      if (downloadResult?.success) {
        return "✓ v" + updateInfo.latestVersion + " 已下载 - 可安装";
      } else {
        return "有新版本可用：v" + updateInfo.latestVersion;
      }
    } else {
      return "已是最新版本 (v" + updateInfo.currentVersion + ")";
    }
  };

  return (
    <PanelSection title="插件更新">
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={handleCheckForUpdate}
          disabled={checkingUpdate}
          description={getStatusMessage()}
        >
          {checkingUpdate ? '正在检查更新…' : '检查更新'}
        </ButtonItem>
      </PanelSectionRow>

      {updateInfo && updateInfo.updateAvailable && !downloadResult?.success && (
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={handleDownloadUpdate}
            disabled={downloadingUpdate}
            description={`下载版本 ${updateInfo.latestVersion}`}
          >
            {downloadingUpdate ? '正在下载…' : '下载更新'}
          </ButtonItem>
        </PanelSectionRow>
      )}

      {downloadResult?.success && (
        <>
          <PanelSectionRow>
            <Field label="下载完成！">
              <Focusable>
                文件已保存至：{downloadResult.download_path}
              </Focusable>
            </Field>
          </PanelSectionRow>
          
          <PanelSectionRow>
            <Field label="安装说明：">
              <Focusable>
                1. 打开 Decky Loader 设置<br />
                2. 点击“开发者”标签<br />
                3. 在“Lossless Scaling”旁点击“卸载”<br />
                4. 点击“从 ZIP 安装”<br />
                5. 选择刚刚下载的文件<br />
                6. 重启 Steam 或重新加载插件
              </Focusable>
            </Field>
          </PanelSectionRow>
        </>
      )}

      {updateError && (
        <PanelSectionRow>
          <Field label="错误：">
            <Focusable>
              {updateError}
            </Focusable>
          </Field>
        </PanelSectionRow>
      )}
    </PanelSection>
  );
};
