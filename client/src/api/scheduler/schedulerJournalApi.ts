import { GetJournalQueryRequest, ScheduledTaskJournalEntity, ScheduledTaskJournalEntityResponse } from '../../models/scheduler/ScheduledTaskJournalEntity';
import { PagedResult } from '../../shared/models/PagedResult';
import { prepareScheduledTaskJournal } from './schedulerJournalApiMapping';
import { getPagedEntities } from '../basicApi';

const basicUrl = 'api/Scheduler';

export const getPagedScheduledTaskJournal = async (
    query: GetJournalQueryRequest
): Promise<PagedResult<ScheduledTaskJournalEntity>> => {
    const pagedResult = await getPagedEntities<GetJournalQueryRequest, ScheduledTaskJournalEntityResponse>(`${basicUrl}/journal`, query);
    return {
        ...pagedResult,
        items: (pagedResult.items || []).map(prepareScheduledTaskJournal)
    };
};
