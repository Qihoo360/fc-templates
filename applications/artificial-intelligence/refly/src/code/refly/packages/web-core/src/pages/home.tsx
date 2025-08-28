import { Typography } from 'antd';
import { PrimaryPageLayout, PrimaryPageLayoutContextUpdater, ShareProjectBtn } from '@refly/layout';
import { SideBar } from '../features/SideBar';

export function HomePage() {
  return (
    <PrimaryPageLayout>
      <PrimaryPageLayoutContextUpdater
        title={<Typography.Text type="success">Home</Typography.Text>}
        actions={[<ShareProjectBtn key="share-project-btn" />]}
      />
      <div>
        <SideBar />
        <h2>Content</h2>
      </div>
    </PrimaryPageLayout>
  );
}
