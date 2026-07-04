import http, {
    type FractalResponseData,
    getPaginationSet,
    type PaginatedResult,
    withQueryBuilderParams,
} from '@/api/http';
import { rawDataToServerObject, type Server } from '@/api/server/getServer';

interface QueryParams {
    query?: string;
    page?: number;
    type?: string;
    sort?: string;
    filterField?: string;
    filterValue?: string | number;
}

export default ({
    query,
    sort,
    filterField,
    filterValue,
    ...params
}: QueryParams): Promise<PaginatedResult<Server>> => {
    const sorts: Record<string, 'asc' | 'desc'> = {};
    if (sort) {
        const dir = sort.startsWith('-') ? 'desc' : 'asc';
        sorts[dir === 'desc' ? sort.slice(1) : sort] = dir;
    }

    const filters: Record<string, string | number> = {};
    if (query) {
        filters['*'] = query;
    }
    if (filterField && filterValue !== undefined && filterValue !== '') {
        filters[filterField] = filterValue;
    }

    return new Promise((resolve, reject) => {
        http.get('/api/client', {
            params: withQueryBuilderParams({
                page: params.page,
                sorts: Object.keys(sorts).length > 0 ? sorts : undefined,
                filters: Object.keys(filters).length > 0 ? filters : undefined,
            }),
        })
            .then(({ data }) =>
                resolve({
                    items: (data.data || []).map((datum: FractalResponseData) => rawDataToServerObject(datum)),
                    pagination: getPaginationSet(data.meta.pagination),
                }),
            )
            .catch(reject);
    });
};
