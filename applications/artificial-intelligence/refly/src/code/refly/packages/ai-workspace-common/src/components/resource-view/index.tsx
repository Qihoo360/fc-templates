import { Button, Skeleton, Empty, Alert, Result } from 'antd';
import { useEffect, useState, memo, useCallback, useMemo } from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { Markdown } from '@refly-packages/ai-workspace-common/components/markdown';
import { LoadingOutlined, ReloadOutlined } from '@ant-design/icons';
import { IconSubscription } from '@refly-packages/ai-workspace-common/components/common/icon';
import { ResourceIcon } from '@refly-packages/ai-workspace-common/components/common/resourceIcon';
import { genUniqueId } from '@refly/utils/id';
import { SelectionContext } from '@refly-packages/ai-workspace-common/modules/selection-menu/selection-context';
import { useGetResourceDetail } from '@refly-packages/ai-workspace-common/queries';
import { IndexError, Resource } from '@refly/openapi-schema';

import './index.scss';
import { IContextItem } from '@refly/common-types';
import { time } from '@refly-packages/ai-workspace-common/utils/time';
import { LOCALE } from '@refly/common-types';
import { TFunction } from 'i18next';
import { useSubscriptionStoreShallow } from '@refly/stores';
import { useCanvasContext } from '@refly-packages/ai-workspace-common/context/canvas';
import { useFetchShareData } from '@refly-packages/ai-workspace-common/hooks/use-fetch-share-data';
import { logEvent } from '@refly/telemetry-web';

interface ResourceViewProps {
  resourceId: string;
  shareId?: string;
  nodeId: string;
  deckSize: number;
  setDeckSize: (size: number) => void;
}

const ResourceMeta = memo(
  ({
    resourceDetail,
    isReindexing,
    onReindex,
  }: {
    resourceDetail: Resource;
    isReindexing: boolean;
    onReindex: (resourceId: string) => void;
  }) => {
    const { t, i18n } = useTranslation();
    const language = i18n.languages?.[0];
    const indexStatus = resourceDetail?.indexStatus ?? 'finish';

    return (
      <div className="knowledge-base-resource-meta">
        {['wait_parse', 'wait_index', 'index_failed'].includes(indexStatus) && (
          <Alert
            className="py-[8px] px-[15px] !items-center"
            style={{ marginBottom: 16 }}
            type={['wait_index', 'wait_parse'].includes(indexStatus) ? 'warning' : 'error'}
            showIcon
            icon={['wait_index', 'wait_parse'].includes(indexStatus) ? <LoadingOutlined /> : null}
            description={
              t(`resource.${indexStatus}`) +
              (['wait_index', 'index_failed'].includes(indexStatus)
                ? `: ${t(`resource.${indexStatus}_tip`)}`
                : '')
            }
            action={
              ['index_failed'].includes(indexStatus) ? (
                <Button
                  size="small"
                  loading={isReindexing}
                  icon={<ReloadOutlined />}
                  className="retry-btn"
                  onClick={() => onReindex(resourceDetail.resourceId)}
                >
                  {t('common.retry')}
                </Button>
              ) : null
            }
          />
        )}

        <div className="knowledge-base-directory-site-intro">
          <div className="site-intro-icon flex justify-center items-center">
            <ResourceIcon
              url={resourceDetail?.data?.url ?? ''}
              resourceType={resourceDetail?.resourceType}
              extension={resourceDetail?.downloadURL?.split('.').pop()}
              size={24}
            />
          </div>
          <div className="site-intro-content flex flex-col justify-center">
            {resourceDetail?.resourceType === 'file' && resourceDetail?.title && (
              <p className="text-gray-700 font-medium">{resourceDetail?.title}</p>
            )}
            {resourceDetail?.data?.url && (
              <a
                className="site-intro-site-url no-underline text-[#0E9F77]"
                href={resourceDetail?.data?.url}
                target="_blank"
                rel="noreferrer"
              >
                {resourceDetail?.data?.url}
              </a>
            )}
            {resourceDetail?.createdAt && (
              <p className="text-gray-400">
                {time(resourceDetail?.createdAt, language as LOCALE)
                  .utc()
                  .fromNow()}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.resourceDetail?.resourceId === nextProps.resourceDetail?.resourceId &&
      prevProps.resourceDetail?.indexStatus === nextProps.resourceDetail?.indexStatus &&
      prevProps.isReindexing === nextProps.isReindexing
    );
  },
);

const genIndexErrorSubTitle = (indexError: IndexError, t: TFunction) => {
  if (indexError?.type === 'pageLimitExceeded') {
    return t('resource.pageLimitExceeded', {
      numPages: indexError.metadata?.numPages,
      used: indexError.metadata?.pageUsed,
      limit: indexError.metadata?.pageLimit,
    });
  }
  return t('resource.unknownError');
};

const ResourceContent = memo(
  ({
    resourceDetail,
    resourceId,
  }: {
    resourceDetail: Resource;
    resourceId: string;
  }) => {
    const { readonly } = useCanvasContext();
    const buildContextItem = useCallback(
      (text: string) => {
        return {
          type: 'resourceSelection',
          entityId: genUniqueId(),
          title: text.slice(0, 50),
          selection: {
            content: text,
            sourceTitle: resourceDetail.title,
            sourceEntityId: resourceDetail.resourceId,
            sourceEntityType: 'resource',
          },
        } as IContextItem;
      },
      [resourceDetail],
    );

    const getSourceNode = useCallback(() => {
      return {
        type: 'resource' as const,
        entityId: resourceId,
      };
    }, [resourceId]);

    return (
      <div className={classNames(`knowledge-base-resource-content resource-content-${resourceId}`)}>
        <div className="knowledge-base-resource-content-title">{resourceDetail?.title}</div>
        <Markdown content={resourceDetail?.content || ''} className="text-base" />
        {!readonly && (
          <SelectionContext
            containerClass={`resource-content-${resourceId}`}
            getContextItem={buildContextItem}
            getSourceNode={getSourceNode}
          />
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.resourceDetail?.resourceId === nextProps.resourceDetail?.resourceId &&
      prevProps.resourceDetail?.content === nextProps.resourceDetail?.content
    );
  },
);

export const ResourceView = memo(
  (props: ResourceViewProps) => {
    const { resourceId, shareId } = props;
    const { readonly } = useCanvasContext();
    const { t } = useTranslation();
    const [isReindexing, setIsReindexing] = useState(false);
    const { setSubscribeModalVisible } = useSubscriptionStoreShallow((state) => ({
      setSubscribeModalVisible: state.setSubscribeModalVisible,
    }));

    const {
      data,
      refetch: refetchResourceDetail,
      isLoading,
    } = useGetResourceDetail({ query: { resourceId } }, undefined, {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      enabled: !shareId,
    });
    const { data: shareData } = useFetchShareData<Resource>(shareId);
    const resourceDetail = useMemo(() => shareData || data?.data || null, [shareData, data]);
    const indexStatus = resourceDetail?.indexStatus ?? 'finish';

    const handleReindexResource = useCallback(
      async (resourceId: string) => {
        if (!resourceId || isReindexing) return;

        setIsReindexing(true);
        const { data, error } = await getClient().reindexResource({
          body: {
            resourceIds: [resourceId],
          },
        });
        setIsReindexing(false);

        if (error || !data?.success) {
          return;
        }
        refetchResourceDetail();
      },
      [isReindexing, refetchResourceDetail],
    );

    useEffect(() => {
      let intervalId: NodeJS.Timeout;
      if (['wait_parse', 'wait_index'].includes(indexStatus)) {
        intervalId = setInterval(() => {
          refetchResourceDetail();
        }, 2000);
      }
      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }, [resourceDetail?.indexStatus, refetchResourceDetail]);

    const handleClickUpgrade = useCallback(() => {
      logEvent('subscription::upgrade_click', 'parse_page_limit_exceeded');
      setSubscribeModalVisible(true);
    }, [setSubscribeModalVisible]);

    if (!resourceId) {
      return (
        <div className="w-full h-full flex justify-center items-center">
          <Empty description={t('common.empty')} />
        </div>
      );
    }

    return (
      <div className="knowledge-base-resource-detail-container pt-[16px]">
        <div className="h-full">
          {isLoading || !resourceDetail ? (
            <div className="knowledge-base-resource-skeleton">
              <Skeleton active style={{ marginTop: 24 }} />
              <Skeleton active style={{ marginTop: 24 }} />
              <Skeleton active style={{ marginTop: 24 }} />
              <Skeleton active style={{ marginTop: 24 }} />
            </div>
          ) : (
            <>
              <ResourceMeta
                resourceDetail={resourceDetail}
                isReindexing={isReindexing}
                onReindex={handleReindexResource}
              />
              {resourceDetail?.indexStatus === 'parse_failed' ? (
                <div className="w-full h-full flex justify-center items-center">
                  <Result
                    status="500"
                    title={t('resource.parse_failed')}
                    subTitle={genIndexErrorSubTitle(resourceDetail?.indexError ?? {}, t)}
                    extra={
                      !readonly && (
                        <div className="flex justify-center items-center gap-2">
                          <Button
                            icon={<ReloadOutlined />}
                            onClick={() => handleReindexResource(resourceId)}
                          >
                            {t('common.retry')}
                          </Button>
                          {resourceDetail?.indexError?.type === 'pageLimitExceeded' && (
                            <Button
                              type="primary"
                              icon={<IconSubscription />}
                              onClick={handleClickUpgrade}
                            >
                              {t('common.upgradeSubscription')}
                            </Button>
                          )}
                        </div>
                      )
                    }
                  />
                </div>
              ) : (
                <ResourceContent resourceDetail={resourceDetail} resourceId={resourceId} />
              )}
            </>
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => prevProps.resourceId === nextProps.resourceId,
);
