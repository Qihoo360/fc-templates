import { useListMcpServers } from '@refly-packages/ai-workspace-common/queries';
import { useUserStoreShallow } from '@refly/stores';
import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import { McpServerList } from './McpServerList';
import { CommunityMcpList } from './CommunityMcpList';
import { ContentHeader } from '../contentHeader';
import { Button, Modal } from 'antd';
import { HiMiniBuildingStorefront } from 'react-icons/hi2';
import { Close } from 'refly-icons';
import { McpServerBatchImport } from './McpServerBatchImport';
import '../model-providers/index.scss';
import { McpServerDTO } from '@refly-packages/ai-workspace-common/requests';

export const McpServerTab = ({ visible }: { visible: boolean }) => {
  const { t } = useTranslation();
  const [openMcpStoreModal, setOpenMcpStoreModal] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingServer, setEditingServer] = useState<McpServerDTO | null>(null);

  const isLogin = useUserStoreShallow((state) => state.isLogin);

  // Fetch MCP servers for the community tab to check installed status
  const { data: mcpServersData, refetch } = useListMcpServers({}, [], {
    enabled: visible && isLogin,
    refetchOnWindowFocus: false,
  });

  const mcpServers = mcpServersData?.data || [];
  const renderCustomActions = useMemo(() => {
    return (
      <div className="flex items-center gap-2">
        <Button
          type="text"
          className="font-semibold border-solid border-[1px] border-refly-Card-Border rounded-lg"
          icon={<HiMiniBuildingStorefront />}
          onClick={() => setOpenMcpStoreModal(true)}
        >
          {t('settings.mcpServer.mcpStore')}
        </Button>
        <McpServerBatchImport onSuccess={() => refetch()} />
        <Button
          type="primary"
          className="font-semibold"
          onClick={() => {
            setIsFormVisible(true);
            setEditingServer(null);
          }}
        >
          {t('settings.mcpServer.addServer')}
        </Button>
      </div>
    );
  }, [t, refetch, setIsFormVisible, setEditingServer, setOpenMcpStoreModal]);

  if (!visible) return null;

  return (
    <div className="h-full flex flex-col">
      <ContentHeader title="MCP" customActions={renderCustomActions} />

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        <McpServerList
          visible={visible}
          isFormVisible={isFormVisible}
          setIsFormVisible={setIsFormVisible}
          editingServer={editingServer}
          setEditingServer={setEditingServer}
        />
      </div>

      <Modal
        open={openMcpStoreModal}
        onCancel={() => setOpenMcpStoreModal(false)}
        title={null}
        footer={null}
        className="provider-store-modal"
        width="calc(100vw - 80px)"
        height="calc(100vh - 80px)"
        centered
        closable={false}
      >
        <div className="h-full w-full overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-5 border-solid border-[1px] border-x-0 border-t-0 border-refly-Card-Border">
            <div className="text-lg font-semibold text-refly-text-0 leading-7">
              {t('settings.mcpServer.mcpStore')}
            </div>
            <Button
              type="text"
              icon={<Close size={24} />}
              onClick={() => setOpenMcpStoreModal(false)}
            />
          </div>
          <CommunityMcpList
            visible={openMcpStoreModal}
            installedServers={mcpServers}
            onInstallSuccess={() => refetch()}
          />
        </div>
      </Modal>
    </div>
  );
};
