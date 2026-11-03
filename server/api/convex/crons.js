import { cronJobs, makeFunctionReference } from 'convex/server';
const crons = cronJobs();
crons.interval('expire ephemeral data', { minutes: 15 }, makeFunctionReference('cleanup:expired'));
export default crons;
