import { time } from '@refly-packages/ai-workspace-common/utils/time';
import { Dropdown, Button, Popconfirm, message, Empty, Divider, Typography, Image } from 'antd';
import InfiniteScroll from 'react-infinite-scroll-component';
import {
  Spinner,
  EndMessage,
} from '@refly-packages/ai-workspace-common/components/workspace/scroll-loading';
import type { MenuProps, DropdownProps } from 'antd';
import {
  IconMoreHorizontal,
  IconDelete,
  IconProject,
  IconPlus,
  IconEdit,
} from '@refly-packages/ai-workspace-common/components/common/icon';

import { useEffect, useState, useMemo, useCallback } from 'react';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { LOCALE } from '@refly/common-types';
import { useTranslation } from 'react-i18next';

import { useFetchDataList } from '@refly-packages/ai-workspace-common/hooks/use-fetch-data-list';
import { Spin } from '@refly-packages/ai-workspace-common/components/common/spin';
import { Project } from '@refly/openapi-schema';
import { CreateProjectModal } from '@refly-packages/ai-workspace-common/components/project/project-create';
import { useNavigate } from 'react-router-dom';
import { useGetProjectCanvasId } from '@refly-packages/ai-workspace-common/hooks/use-get-project-canvasId';
import { SlPicture } from 'react-icons/sl';
import { useProjectSelectorStoreShallow } from '@refly/stores';
import { useSiderStoreShallow } from '@refly/stores';
import { DATA_NUM } from '@refly-packages/ai-workspace-common/hooks/use-handle-sider-data';
import { useUserStore } from '@refly/stores';

export const ActionDropdown = ({
  project,
  afterDelete,
  setEditProjectModalVisible,
}: {
  project: Project;
  afterDelete: () => void;
  setEditProjectModalVisible: (visible: boolean) => void;
}) => {
  const { t } = useTranslation();
  const [popupVisible, setPopupVisible] = useState(false);

  const handleDelete = async () => {
    const res = await getClient().deleteProject({
      body: {
        projectId: project.projectId,
      },
    });
    if (res?.data?.success) {
      message.success(t('project.action.deleteSuccess'));
      afterDelete?.();
    }
  };

  const handleEdit = () => {
    setEditProjectModalVisible(true);
  };

  const items: MenuProps['items'] = [
    {
      label: (
        <div className="flex items-center flex-grow">
          <IconEdit size={16} className="mr-2" />
          {t('workspace.deleteDropdownMenu.edit')}
        </div>
      ),
      key: 'edit',
      onClick: handleEdit,
    },
    {
      label: (
        <Popconfirm
          placement="bottomLeft"
          title={t('project.action.deleteConfirm', {
            name: project?.name || t('common.untitled'),
          })}
          onConfirm={(e) => {
            e?.stopPropagation();
            handleDelete();
          }}
          onCancel={(e?: React.MouseEvent) => {
            e?.stopPropagation();
            setPopupVisible(false);
          }}
          okText={t('common.confirm')}
          cancelText={t('common.cancel')}
          overlayStyle={{ maxWidth: '300px' }}
        >
          <div
            className="flex items-center text-red-600 flex-grow dark:text-red-300"
            onClick={(e) => e.stopPropagation()}
          >
            <IconDelete size={16} className="mr-2" />
            {t('workspace.deleteDropdownMenu.delete')}
          </div>
        </Popconfirm>
      ),
      key: 'delete',
    },
  ];

  const handleOpenChange: DropdownProps['onOpenChange'] = (open: boolean, info: any) => {
    if (info.source === 'trigger') {
      setPopupVisible(open);
    }
  };

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <Dropdown
        trigger={['click']}
        open={popupVisible}
        onOpenChange={handleOpenChange}
        menu={{ items }}
      >
        <Button
          type="text"
          icon={<IconMoreHorizontal />}
          onClick={(e) => {
            e.stopPropagation();
          }}
        />
      </Dropdown>
    </div>
  );
};

const ProjectCard = ({
  project,
  onDelete,
  reload,
  handleClick,
}: {
  project: Project;
  onDelete: () => void;
  reload: () => void;
  handleClick: () => void;
}) => {
  const { t, i18n } = useTranslation();
  const language = i18n.languages?.[0];
  const [editProjectModalVisible, setEditProjectModalVisible] = useState(false);

  return (
    <div
      className="bg-white rounded-lg overflow-hidden border border-solid cursor-pointer border-gray-200 hover:border-green-500 transition-colors duration-200 dark:bg-gray-900 dark:border-gray-700 dark:hover-green-400"
      onClick={handleClick}
    >
      <div className="h-36 px-4 py-3 overflow-hidden">
        {project?.coverUrl ? (
          <Image
            src={project?.coverUrl}
            alt={project?.name || t('common.untitled')}
            preview={false}
          />
        ) : (
          <div className="flex items-center justify-center h-full flex-col">
            <SlPicture size={48} className="text-gray-300 dark:text-gray-600" />
            <div className="mt-2 text-gray-300 dark:text-gray-600">
              {t('project.waitingUploadCover')}
            </div>
          </div>
        )}
      </div>
      <Divider className="m-0 text-gray-200 dark:text-gray-800" />
      <div className="px-3 pt-2 pb-1 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-3 mb-2">
          <IconProject className="text-gray-500 dark:text-gray-400" size={24} />
          <div className="flex-1 mi-w-0">
            <Typography.Text className="text-sm font-medium w-48" ellipsis={{ tooltip: true }}>
              {project?.name || t('common.untitled')}
            </Typography.Text>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {project?.updatedAt &&
                time(project?.updatedAt, language as LOCALE)
                  .utc()
                  .fromNow()}
            </p>
          </div>
        </div>

        <ActionDropdown
          project={project}
          afterDelete={onDelete}
          setEditProjectModalVisible={setEditProjectModalVisible}
        />
      </div>

      <CreateProjectModal
        mode="edit"
        projectId={project?.projectId}
        title={project?.name}
        description={project?.description}
        instructions={project?.customInstructions}
        coverPicture={project?.coverUrl}
        visible={editProjectModalVisible}
        setVisible={setEditProjectModalVisible}
        onSuccess={() => {
          reload();
        }}
      />
    </div>
  );
};

const CreateCard = ({
  reload,
  setVisible,
}: {
  reload: () => void;
  setVisible: (visible: boolean) => void;
}) => {
  const { t } = useTranslation();
  const [createProjectModalVisible, setCreateProjectModalVisible] = useState(false);
  return (
    <div className="bg-gray-50 rounded-lg overflow-hidden border border-solid cursor-pointer border-gray-200 hover:border-green-500 transition-colors duration-200 dark:bg-gray-900 dark:border-gray-700 dark:hover-green-400">
      <div
        className="flex items-center justify-center h-full w-full flex-col"
        onClick={() => {
          setCreateProjectModalVisible(true);
        }}
      >
        <IconPlus className="text-gray-500" size={24} />
        <div className="mt-2 text-gray-500 text-base">{t('project.create')}</div>
      </div>
      <CreateProjectModal
        mode="create"
        visible={createProjectModalVisible}
        setVisible={setCreateProjectModalVisible}
        onSuccess={() => {
          reload();
          setVisible(false);
        }}
      />
    </div>
  );
};

interface ProjectListProps {
  refresh: boolean;
  setRefresh: (refresh: boolean) => void;
  setShowLibraryModal: (showLibraryModal: boolean) => void;
  showLibraryModal: boolean;
}
const ProjectList = ({
  refresh,
  setRefresh,
  showLibraryModal,
  setShowLibraryModal,
}: ProjectListProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [createProjectModalVisible, setCreateProjectModalVisible] = useState(false);
  const { projectId } = useGetProjectCanvasId();

  // Get selectedProjectId from store for initial value only
  const { setSelectedProjectId } = useProjectSelectorStoreShallow((state) => ({
    selectedProjectId: state.selectedProjectId,
    setSelectedProjectId: state.setSelectedProjectId,
  }));

  const { updateProjectsList } = useSiderStoreShallow((state) => ({
    updateProjectsList: state.setProjectsList,
  }));

  const { dataList, loadMore, reload, hasMore, isRequesting, setDataList } = useFetchDataList({
    fetchData: async (queryPayload) => {
      const { isLogin } = useUserStore.getState();
      if (!isLogin) return { success: true, data: [] };

      const res = await getClient().listProjects({
        query: queryPayload,
      });
      return res?.data ?? { success: true, data: [] };
    },
    pageSize: 12,
  });

  const handleCardClick = async (project: Project) => {
    setShowLibraryModal(false);
    navigate(`/project/${project.projectId}?canvasId=empty`);
  };

  const projectCards = useMemo(() => {
    return dataList?.map((item) => (
      <ProjectCard
        key={item.projectId}
        project={item}
        onDelete={() => {
          setDataList(dataList.filter((n) => n.projectId !== item.projectId));
          if (projectId === item.projectId) {
            setSelectedProjectId(item.projectId);
            navigate('/');
          }
        }}
        reload={reload}
        handleClick={() => handleCardClick(item)}
      />
    ));
  }, [dataList, setDataList]);

  const handleLoadMore = useCallback(() => {
    if (!isRequesting && hasMore) {
      loadMore();
    }
  }, [isRequesting, hasMore, loadMore]);

  useEffect(() => {
    if (showLibraryModal) {
      reload();
    } else {
      setDataList([]);
    }
  }, [showLibraryModal]);

  useEffect(() => {
    if (refresh) {
      reload();
      setRefresh(false);
    }
  }, [refresh]);

  useEffect(() => {
    const formattedProjects = dataList
      .map((project) => ({
        id: project.projectId,
        name: project.name,
        description: project.description,
        updatedAt: project.updatedAt ?? '',
        coverUrl: project.coverUrl,
        type: 'project' as const,
      }))
      .slice(0, DATA_NUM);
    updateProjectsList(formattedProjects);
  }, [dataList]);

  const emptyState = (
    <div className="h-full flex items-center justify-center">
      <Empty description={t('common.empty')}>
        <Button
          className="text-[#0E9F77]"
          icon={<IconPlus className="-mr-1 flex items-center justify-center" />}
          onClick={() => {
            setCreateProjectModalVisible(true);
          }}
        >
          {t('project.create')}
        </Button>
      </Empty>
      <CreateProjectModal
        visible={createProjectModalVisible}
        setVisible={setCreateProjectModalVisible}
        onSuccess={() => {
          reload();
          setShowLibraryModal(false);
        }}
      />
    </div>
  );

  return (
    <Spin className="w-full h-full" spinning={isRequesting && dataList.length === 0}>
      <div id="projectScrollableDiv" className="w-full h-[calc(60vh-60px)] overflow-y-auto">
        {dataList.length > 0 ? (
          <InfiniteScroll
            dataLength={dataList.length}
            next={handleLoadMore}
            hasMore={hasMore}
            loader={isRequesting ? <Spinner /> : null}
            endMessage={<EndMessage />}
            scrollableTarget="projectScrollableDiv"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
              <CreateCard reload={reload} setVisible={setShowLibraryModal} />
              {projectCards}
            </div>
          </InfiniteScroll>
        ) : (
          !isRequesting && emptyState
        )}
      </div>
    </Spin>
  );
};

export { ProjectList };
