import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, Skeleton, Empty } from 'antd';
import type { TabsProps } from 'antd';
import { useReferencesStoreShallow } from '@refly/stores';
import {
  IconResource,
  IconCanvas,
} from '@refly-packages/ai-workspace-common/components/common/icon';
import './index.scss';
import { Reference } from '@refly/openapi-schema';

interface ResourceDeckProps {
  domain: 'resource' | 'document';
  id?: string;
}

const ResourceDeck = (props: ResourceDeckProps) => {
  const { domain, id } = props;
  const { t } = useTranslation();
  const { references, referencedBy, fetchReferences, fetchReferencedBy, setDomain, setId } =
    useReferencesStoreShallow((state) => ({
      references: state.references,
      referencedBy: state.referencedBy,
      fetchReferences: state.fetchReferences,
      fetchReferencedBy: state.fetchReferencedBy,
      setDomain: state.setDomain,
      setId: state.setId,
    }));

  const ReferenceList = (props: {
    list: Reference[];
    type: 'source' | 'target';
    loading: boolean;
  }) => {
    const { list, type, loading } = props;

    const handleClick = (reference: Reference) => {
      if (type === 'target') {
        const meta = reference.targetMeta;
        const url = meta?.url;
        window.open(url, '_blank');
      } else {
        const meta = reference.sourceMeta;
        const url = meta?.url;
        window.open(url, '_blank');
      }
    };

    return (
      <div>
        {loading ? (
          <Skeleton />
        ) : list.length ? (
          list.map((reference) => {
            return (
              <div
                key={reference.referenceId}
                className="flex items-center justify-between gap-2 p-1 hover:bg-gray-100 rounded-md"
                onClick={() => {
                  handleClick(reference);
                }}
              >
                <div className="flex items-center justify-center gap-2">
                  {reference[`${type}Type`] === 'resource' ? <IconResource /> : <IconCanvas />}
                  <div>{reference[`${type}Meta`]?.title}</div>
                </div>
              </div>
            );
          })
        ) : (
          <Empty description={t('common.empty')} />
        )}
      </div>
    );
  };

  const items: TabsProps['items'] = [
    {
      key: 'references',
      label: t('deck.references'),
      children: <ReferenceList list={references.data} type="target" loading={references.loading} />,
    },
    {
      key: 'referencedBy',
      label: t('deck.referencedBy'),
      children: (
        <ReferenceList list={referencedBy.data} type="source" loading={referencedBy.loading} />
      ),
    },
  ];

  useEffect(() => {
    setDomain(domain);
    setId(id ?? '');
    fetchReferences({ sourceId: id, sourceType: domain });
    fetchReferencedBy({ targetId: id, targetType: domain });
  }, [domain, id, setDomain, setId, fetchReferences, fetchReferencedBy]);

  return (
    <div className="deck h-full w-full box-border px-6">
      <Tabs items={items} className="h-full" />
    </div>
  );
};

export default ResourceDeck;
