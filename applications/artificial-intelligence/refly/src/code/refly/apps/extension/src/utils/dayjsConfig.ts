import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

dayjs.extend(relativeTime);

//这里需要国际化
dayjs.locale('zh-cn');

export default dayjs;
