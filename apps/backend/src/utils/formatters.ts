import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";

dayjs.extend(relativeTime);

export const formatActivityMessage = (actorName: string, taskTitle: string, from: string, to: string) =>
  `${actorName} moved ${taskTitle} from ${from} -> ${to}`;

export const toRelativeTime = (value: Date) => dayjs(value).fromNow();
