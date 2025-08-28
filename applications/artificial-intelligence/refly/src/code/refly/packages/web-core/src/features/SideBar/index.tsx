import { openModal } from '@refly/ui-kit';
import { Button } from 'antd';

export function SideBar() {
  return (
    <Button
      onClick={() =>
        openModal({
          Title: 'hello',
          Content: <div>This is a modal example</div>,
          mode: 'modal',
          size: 'small',
        })
      }
    >
      Open Modal
    </Button>
  );
}
