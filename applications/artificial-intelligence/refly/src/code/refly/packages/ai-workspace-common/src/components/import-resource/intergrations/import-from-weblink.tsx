import { useState } from 'react';
import { Button, Input, message } from 'antd';
import { isUrl } from '@refly/utils/isUrl';
import { genUniqueId } from '@refly/utils/id';
import { useImportResourceStoreShallow } from '@refly/stores';
// request
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { useTranslation } from 'react-i18next';

const { TextArea } = Input;

export const ImportFromWeblink = () => {
  const { t } = useTranslation();
  const [linkStr, setLinkStr] = useState('');
  const { addToWaitingList, updateWaitingListItem } = useImportResourceStoreShallow((state) => ({
    addToWaitingList: state.addToWaitingList,
    updateWaitingListItem: state.updateWaitingListItem,
  }));

  const scrapeSingleUrl = async (waitingItemId: string, url: string) => {
    try {
      const { data, error } = await getClient().scrape({ body: { url } });

      if (error) {
        throw error;
      }

      const { title, description, image } = data?.data ?? {};

      // Update the waiting list item with scraped data
      updateWaitingListItem(waitingItemId, {
        title: title ?? '',
        content: description ?? '',
        link: {
          key: waitingItemId,
          url,
          title: title ?? '',
          description: description ?? '',
          image: image ?? '',
          isHandled: true,
          isError: false,
        },
      });
    } catch (err) {
      console.log('fetch url error, silent ignore', err);
      // Update the waiting list item with error status
      updateWaitingListItem(waitingItemId, {
        status: 'error',
        link: {
          key: waitingItemId,
          url,
          title: '',
          description: '',
          image: '',
          isHandled: false,
          isError: true,
        },
      });
    }
  };

  const scrapeLink = async (linkStr: string) => {
    try {
      const links: string[] = linkStr
        .split('\n')
        .filter((str) => str && isUrl(str))
        .map((url) => url.trim());

      if (links?.length === 0) {
        message.warning(t('resource.import.linkFormatError'));
        return;
      }

      // Add each link to the waiting list
      for (const url of links) {
        const waitingItemId = genUniqueId();
        addToWaitingList({
          id: waitingItemId,
          type: 'weblink',
          title: url, // Use URL as initial title
          url,
          status: 'pending',
          link: {
            key: waitingItemId,
            url,
            title: '',
            description: '',
            image: '',
            isHandled: false,
            isError: false,
          },
        });

        // Start scraping the link information
        scrapeSingleUrl(waitingItemId, url);
      }

      setLinkStr('');
      message.success(t('resource.import.addedToWaitingList', { count: links.length }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full relative mb-1.5">
      <TextArea
        placeholder={t('resource.import.webLinkPlaceholer')}
        rows={6}
        autoSize={{
          minRows: 6,
          maxRows: 6,
        }}
        value={linkStr}
        onChange={(e) => setLinkStr(e.target.value)}
        className="weblink-input"
      />
      <Button
        type="default"
        className="absolute bottom-2 right-2 z-10"
        disabled={!linkStr}
        onClick={() => {
          scrapeLink(linkStr);
        }}
      >
        {t('resource.import.addToWaiting')}
      </Button>
    </div>
  );
};
