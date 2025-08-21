import { useState, useEffect } from "react";
import {
  PanelSectionRow,
  Dropdown,
  DropdownOption,
  showModal,
  ConfirmModal,
  Field,
  DialogButton,
  ButtonItem,
  ModalRoot,
  TextField,
  Focusable,
  AppOverview,
  Router
} from "@decky/ui";
import { RiArrowDownSFill, RiArrowUpSFill } from "react-icons/ri";
import { 
  getProfiles, 
  createProfile, 
  deleteProfile, 
  renameProfile, 
  setCurrentProfile,
  ProfilesResult,
  ProfileResult
} from "../api/lsfgApi";
import { showSuccessToast, showErrorToast } from "../utils/toastUtils";

const PROFILES_COLLAPSED_KEY = 'lsfg-profiles-collapsed';

interface TextInputModalProps {
  title: string;
  description: string;
  defaultValue?: string;
  okText?: string;
  cancelText?: string;
  onOK: (value: string) => void;
  closeModal?: () => void;
}

function TextInputModal({ 
  title, 
  description, 
  defaultValue = "", 
  okText = "确定", 
  cancelText = "取消", 
  onOK, 
  closeModal 
}: TextInputModalProps) {
  const [value, setValue] = useState(defaultValue);

  const handleOK = () => {
    if (value.trim()) {
      onOK(value);
      closeModal?.();
    }
  };

  return (
    <ModalRoot>
      <div style={{ padding: "16px", minWidth: "400px" }}>
        <h2 style={{ marginBottom: "16px" }}>{title}</h2>
        <p style={{ marginBottom: "24px" }}>{description}</p>
        
        <div style={{ marginBottom: "24px" }}>
          <Field 
            label="名称"
            childrenLayout="below"
            childrenContainerWidth="max"
          >
            <TextField
              value={value}
              onChange={(e) => setValue(e?.target?.value || "")}
              style={{ width: "100%" }}
            />
          </Field>
        </div>
        
        <Focusable
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            marginTop: "16px"
          }}
          flow-children="horizontal"
        >
          <DialogButton onClick={closeModal}>
            {cancelText}
          </DialogButton>
          <DialogButton 
            onClick={handleOK} 
            disabled={!value.trim()}
          >
            {okText}
          </DialogButton>
        </Focusable>
      </div>
    </ModalRoot>
  );
}

interface ProfileManagementProps {
  currentProfile?: string;
  onProfileChange?: (profileName: string) => void;
}

export function ProfileManagement({ currentProfile, onProfileChange }: ProfileManagementProps) {
  const [profiles, setProfiles] = useState<string[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>(currentProfile || "decky-lsfg-vk");
  const [isLoading, setIsLoading] = useState(false);
  const [mainRunningApp, setMainRunningApp] = useState<AppOverview | undefined>(undefined);
  
  // Initialize with localStorage value, fallback to false (expanded) if not found
  const [profilesCollapsed, setProfilesCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem(PROFILES_COLLAPSED_KEY);
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Persist profiles collapse state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PROFILES_COLLAPSED_KEY, JSON.stringify(profilesCollapsed));
    } catch (error) {
      console.warn('Failed to save profiles collapse state:', error);
    }
  }, [profilesCollapsed]);

  // Load profiles on component mount
  useEffect(() => {
    loadProfiles();
  }, []);

  // Update selected profile when prop changes
  useEffect(() => {
    if (currentProfile) {
      setSelectedProfile(currentProfile);
    }
  }, [currentProfile]);

  // Poll for running app every 2 seconds
  useEffect(() => {
    const checkRunningApp = () => {
      setMainRunningApp(Router.MainRunningApp);
    };

    // Check immediately
    checkRunningApp();

    // Set up polling interval
    const interval = setInterval(checkRunningApp, 2000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  const loadProfiles = async () => {
    try {
      const result: ProfilesResult = await getProfiles();
      if (result.success && result.profiles) {
        setProfiles(result.profiles);
        if (result.current_profile) {
          setSelectedProfile(result.current_profile);
        }
      } else {
        console.error("Failed to load profiles:", result.error);
        showErrorToast("加载配置文件失败", result.error || "未知错误");
      }
    } catch (error) {
      console.error("Error loading profiles:", error);
      showErrorToast("加载配置文件出错", String(error));
    }
  };

  const handleProfileChange = async (profileName: string) => {
    setIsLoading(true);
    try {
      const result: ProfileResult = await setCurrentProfile(profileName);
      if (result.success) {
        setSelectedProfile(profileName);
        showSuccessToast("切换成功", `已切换到配置：${profileName}`);
        onProfileChange?.(profileName);
      } else {
        console.error("Failed to switch profile:", result.error);
        showErrorToast("切换配置失败", result.error || "未知错误");
      }
    } catch (error) {
      console.error("Error switching profile:", error);
      showErrorToast("切换配置出错", String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProfile = () => {
    showModal(
      <TextInputModal
        title="新建配置文件"
        description="请输入新配置文件名称。当前配置的设置将被复制。"
        okText="创建"
        cancelText="取消"
        onOK={(name: string) => {
          if (name.trim()) {
            createNewProfile(name.trim());
          }
        }}
      />
    );
  };

  const createNewProfile = async (profileName: string) => {
    setIsLoading(true);
    try {
      const result: ProfileResult = await createProfile(profileName, selectedProfile);
      if (result.success) {
        showSuccessToast("创建成功", `已创建配置：${profileName}`);
        await loadProfiles();
        // 自动切换到新建的配置
        await handleProfileChange(profileName);
      } else {
        console.error("Failed to create profile:", result.error);
        showErrorToast("创建配置失败", result.error || "未知错误");
      }
    } catch (error) {
      console.error("Error creating profile:", error);
      showErrorToast("创建配置出错", String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProfile = () => {
    if (selectedProfile === "decky-lsfg-vk") {
      showErrorToast("无法删除默认配置", "默认配置文件无法被删除");
      return;
    }

    showModal(
      <ConfirmModal
        strTitle="删除配置文件"
        strDescription={`确定要删除配置文件“${selectedProfile}”吗？此操作不可撤销。`}
        strOKButtonText="删除"
        strCancelButtonText="取消"
        onOK={() => deleteSelectedProfile()}
      />
    );
  };

  const deleteSelectedProfile = async () => {
    setIsLoading(true);
    try {
      const result: ProfileResult = await deleteProfile(selectedProfile);
      if (result.success) {
        showSuccessToast("删除成功", `已删除配置：${selectedProfile}`);
        await loadProfiles();
        // 删除当前配置后自动切换到默认
        setSelectedProfile("decky-lsfg-vk");
        onProfileChange?.("decky-lsfg-vk");
      } else {
        console.error("Failed to delete profile:", result.error);
        showErrorToast("删除配置失败", result.error || "未知错误");
      }
    } catch (error) {
      console.error("Error deleting profile:", error);
      showErrorToast("删除配置出错", String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDropdownChange = (option: DropdownOption) => {
    if (option.data === "__NEW_PROFILE__") {
      handleCreateProfile();
    } else {
      handleProfileChange(option.data);
    }
  };

  const handleRenameProfile = () => {
    if (selectedProfile === "decky-lsfg-vk") {
      showErrorToast("无法重命名默认配置", "默认配置文件无法被重命名");
      return;
    }

    showModal(
      <TextInputModal
        title="重命名配置文件"
        description={`请输入配置“${selectedProfile}”的新名称。`}
        defaultValue={selectedProfile}
        okText="重命名"
        cancelText="取消"
        onOK={(newName: string) => {
          if (newName.trim() && newName.trim() !== selectedProfile) {
            renameSelectedProfile(newName.trim());
          }
        }}
      />
    );
  };

  const renameSelectedProfile = async (newName: string) => {
    setIsLoading(true);
    try {
      const result: ProfileResult = await renameProfile(selectedProfile, newName);
      if (result.success) {
        showSuccessToast("重命名成功", `已重命名为：${newName}`);
        await loadProfiles();
        setSelectedProfile(newName);
        onProfileChange?.(newName);
      } else {
        console.error("Failed to rename profile:", result.error);
        showErrorToast("重命名失败", result.error || "未知错误");
      }
    } catch (error) {
      console.error("Error renaming profile:", error);
      showErrorToast("重命名出错", String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const profileOptions: DropdownOption[] = [
    ...profiles.map((profile: string) => ({
      data: profile,
      label: profile === "decky-lsfg-vk" ? "默认" : profile
    })),
    {
      data: "__NEW_PROFILE__",
      label: "新建配置"
    }
  ];

  return (
    <>
      <style>
        {`
        .LSFG_ProfilesCollapseButton_Container > div > div > div > button {
          height: 10px !important;
        }
        .LSFG_ProfilesCollapseButton_Container > div > div > div > div > button {
          height: 10px !important;
        }
        `}
      </style>

      {/* Display currently running game info - always visible */}
      {mainRunningApp && (
        <PanelSectionRow>
          <div style={{ 
            padding: "8px 12px", 
            backgroundColor: "rgba(0, 255, 0, 0.1)", 
            borderRadius: "4px",
            border: "1px solid rgba(0, 255, 0, 0.3)",
            fontSize: "13px"
          }}>
            <strong>{mainRunningApp.display_name}</strong> 正在运行。请关闭游戏后再切换配置。
          </div>
        </PanelSectionRow>
      )}

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
          当前配置：{selectedProfile === "decky-lsfg-vk" ? "默认" : selectedProfile}
        </div>
      </PanelSectionRow>

      <PanelSectionRow>
        <div className="LSFG_ProfilesCollapseButton_Container">
          <ButtonItem
            layout="below"
            bottomSeparator={profilesCollapsed ? "standard" : "none"}
            onClick={() => setProfilesCollapsed(!profilesCollapsed)}
          >
            {profilesCollapsed ? (
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

      {!profilesCollapsed && (
        <>
          <PanelSectionRow>
            <Field
              label=""
              childrenLayout="below"
              childrenContainerWidth="max"
            >
              <Dropdown
                rgOptions={profileOptions}
                selectedOption={selectedProfile}
                onChange={handleDropdownChange}
                disabled={isLoading || !!mainRunningApp}
              />
            </Field>
          </PanelSectionRow>
          
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={handleRenameProfile}
              disabled={isLoading || selectedProfile === "decky-lsfg-vk" || !!mainRunningApp}
            >
              重命名
            </ButtonItem>
          </PanelSectionRow>
          
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={handleDeleteProfile}
              disabled={isLoading || selectedProfile === "decky-lsfg-vk" || !!mainRunningApp}
            >
              删除
            </ButtonItem>
          </PanelSectionRow>
        </>
      )}
    </>
  );
}
