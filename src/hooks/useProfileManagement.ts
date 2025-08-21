import { useState, useEffect, useCallback } from "react";
import {
  getProfiles,
  createProfile,
  deleteProfile,
  renameProfile,
  setCurrentProfile,
  updateProfileConfig,
  type ProfilesResult,
  type ProfileResult,
  type ConfigUpdateResult
} from "../api/lsfgApi";
import { ConfigurationData } from "../config/configSchema";
import { showSuccessToast, showErrorToast } from "../utils/toastUtils";

export function useProfileManagement() {
  const [profiles, setProfiles] = useState<string[]>([]);
  const [currentProfile, setCurrentProfileState] = useState<string>("decky-lsfg-vk");
  const [isLoading, setIsLoading] = useState(false);

  // Load profiles on hook initialization
  const loadProfiles = useCallback(async () => {
    try {
      const result: ProfilesResult = await getProfiles();
      if (result.success && result.profiles) {
        setProfiles(result.profiles);
        if (result.current_profile) {
          setCurrentProfileState(result.current_profile);
        }
        return result;
      } else {
        console.error("Failed to load profiles:", result.error);
        showErrorToast("加载配置文件失败", result.error || "未知错误");
        return result;
      }
    } catch (error) {
      console.error("Error loading profiles:", error);
      showErrorToast("加载配置文件出错", String(error));
      return { success: false, error: String(error) };
    }
  }, []);

  // Create a new profile
  const handleCreateProfile = useCallback(async (profileName: string, sourceProfile?: string) => {
    setIsLoading(true);
    try {
      const result: ProfileResult = await createProfile(profileName, sourceProfile || currentProfile);
      if (result.success) {
        showSuccessToast("创建成功", `已创建配置：${profileName}`);
        await loadProfiles();
        return result;
      } else {
        console.error("Failed to create profile:", result.error);
        showErrorToast("创建配置失败", result.error || "未知错误");
        return result;
      }
    } catch (error) {
      console.error("Error creating profile:", error);
      showErrorToast("创建配置出错", String(error));
      return { success: false, error: String(error) };
    } finally {
      setIsLoading(false);
    }
  }, [currentProfile, loadProfiles]);

  // Delete a profile
  const handleDeleteProfile = useCallback(async (profileName: string) => {
    if (profileName === "decky-lsfg-vk") {
      showErrorToast("无法删除默认配置", "默认配置文件无法被删除");
      return { success: false, error: "无法删除默认配置" };
    }

    setIsLoading(true);
    try {
      const result: ProfileResult = await deleteProfile(profileName);
      if (result.success) {
        showSuccessToast("删除成功", `已删除配置：${profileName}`);
        await loadProfiles();
        // 删除当前配置后自动切换到默认
        if (currentProfile === profileName) {
          setCurrentProfileState("decky-lsfg-vk");
        }
        return result;
      } else {
        console.error("Failed to delete profile:", result.error);
        showErrorToast("删除配置失败", result.error || "未知错误");
        return result;
      }
    } catch (error) {
      console.error("Error deleting profile:", error);
      showErrorToast("删除配置出错", String(error));
      return { success: false, error: String(error) };
    } finally {
      setIsLoading(false);
    }
  }, [currentProfile, loadProfiles]);

  // Rename a profile
  const handleRenameProfile = useCallback(async (oldName: string, newName: string) => {
    if (oldName === "decky-lsfg-vk") {
      showErrorToast("无法重命名默认配置", "默认配置文件无法被重命名");
      return { success: false, error: "无法重命名默认配置" };
    }

    setIsLoading(true);
    try {
      const result: ProfileResult = await renameProfile(oldName, newName);
      if (result.success) {
        showSuccessToast("重命名成功", `已重命名为：${newName}`);
        await loadProfiles();
        // 如果当前配置被重命名则更新
        if (currentProfile === oldName) {
          setCurrentProfileState(newName);
        }
        return result;
      } else {
        console.error("Failed to rename profile:", result.error);
        showErrorToast("重命名失败", result.error || "未知错误");
        return result;
      }
    } catch (error) {
      console.error("Error renaming profile:", error);
      showErrorToast("重命名出错", String(error));
      return { success: false, error: String(error) };
    } finally {
      setIsLoading(false);
    }
  }, [currentProfile, loadProfiles]);

  // Set the current active profile
  const handleSetCurrentProfile = useCallback(async (profileName: string) => {
    setIsLoading(true);
    try {
      const result: ProfileResult = await setCurrentProfile(profileName);
      if (result.success) {
        setCurrentProfileState(profileName);
        showSuccessToast("切换成功", `已切换到配置：${profileName}`);
        return result;
      } else {
        console.error("Failed to switch profile:", result.error);
        showErrorToast("切换配置失败", result.error || "未知错误");
        return result;
      }
    } catch (error) {
      console.error("Error switching profile:", error);
      showErrorToast("切换配置出错", String(error));
      return { success: false, error: String(error) };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update configuration for a specific profile
  const handleUpdateProfileConfig = useCallback(async (profileName: string, config: ConfigurationData) => {
    setIsLoading(true);
    try {
      const result: ConfigUpdateResult = await updateProfileConfig(profileName, config);
      if (result.success) {
        return result;
      } else {
        console.error("Failed to update profile config:", result.error);
        showErrorToast("更新配置失败", result.error || "未知错误");
        return result;
      }
    } catch (error) {
      console.error("Error updating profile config:", error);
      showErrorToast("更新配置出错", String(error));
      return { success: false, error: String(error) };
    } finally {
      setIsLoading(false);
    }
  }, [currentProfile]);

  // Initialize profiles on mount
  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  return {
    profiles,
    currentProfile,
    isLoading,
    loadProfiles,
    createProfile: handleCreateProfile,
    deleteProfile: handleDeleteProfile,
    renameProfile: handleRenameProfile,
    setCurrentProfile: handleSetCurrentProfile,
    updateProfileConfig: handleUpdateProfileConfig
  };
}
