import api, { route } from '@forge/api'
import Resolver from '@forge/resolver'

const resolver = new Resolver()

const FIELD_VALUE = 'field-value'
const FIELD_PROJECT = 'field-project'
const FIELD_OPERATOR = 'field-operator'
const FIELD_VALUE_CONTENT = 'field-value-content'
const FIELD_ONLY_ROW = 'field-only-row'
const FIELD_ONLY_COLUMN = 'field-only-column'

resolver.define('getText', (req) => {
    console.log(req)

    return 'Hello, world!'
})

resolver.define('getProjects', async () => {
    const response = await api
        .asUser()
        .requestJira(route`/rest/api/3/project`, {
            headers: {
                Accept: 'application/json',
            },
        })
    if (!response.ok) {
        throw new Error(response.statusText)
    }
    const json = await response.json()

    const projects = json.map((project) => ({
        label: project.name,
        value: project.name,
    }))
    return projects
})

resolver.define('getIssuesData', async (req) => {
    if (!req.context.extension.gadgetConfiguration) {
        return
    }

    const submittedFilters =
        req.context.extension.gadgetConfiguration.submittedFilters

    const columns = obtainColumns(submittedFilters)

    const rows = await doComparisons(submittedFilters, req.context)

    const data = {
        head: columns,
        rows: rows,
    }
    return data
})

resolver.define('getFields', async () => {
    const response = await api.asUser().requestJira(route`/rest/api/3/field`, {
        headers: {
            Accept: 'application/json',
        },
    })

    if (!response.ok) {
        throw new Error(response.statusText)
    }

    const json = await response.json()

    const fields = json.map((field) => ({
        label: field.name,
        value: field.name,
    }))
    return fields
})

const doComparisons = async (filters, context) => {
    const rows = []
    for (let i = 0; i < filters.length; i++) {
        let currentFilter = filters[i]
        if (currentFilter[FIELD_ONLY_COLUMN]) {
            continue
        }
        let currentFilterCells = [
            {
                key: 'label',
                content: currentFilter[FIELD_VALUE_CONTENT],
            },
        ]
        let totalCount = 0
        for (let j = 0; j < filters.length; j++) {
            let otherFilter = filters[j]
            if (otherFilter[FIELD_ONLY_ROW]) {
                continue
            }
            const comparisonFilters = [currentFilter, otherFilter]
            const jql = JQLBuilder(comparisonFilters)
            const response = await searchByJQL(jql)
            currentFilterCells.push({
                key: otherFilter[FIELD_VALUE_CONTENT],
                content: response.total,
                shouldBeLink: true,
                link: context.siteUrl + '/issues/?jql=' + jql,
            })
            totalCount += response.total
        }
        const currentFilterRow = {
            key: `row-${i}-${currentFilter[FIELD_VALUE_CONTENT]}`,
            cells: currentFilterCells,
            total: totalCount,
        }
        rows.push(currentFilterRow)
    }
    return rows
}

const searchByJQL = async (jql) => {
    const response = await api
        .asUser()
        .requestJira(route`/rest/api/3/search?jql=${jql}&maxResults=5000`, {
            headers: {
                Accept: 'application/json',
            },
        })
    if (!response.ok) {
        throw new Error(response.statusText)
    }
    const jsonResponse = await response.json()
    return jsonResponse
}

const obtainColumns = (filters) => {
    const head = {
        cells: [
            {
                key: 'Labels',
                content: 'Labels',
            },
        ],
    }

    filters.map((filter) => {
        if (filter[FIELD_ONLY_ROW]) {
            return
        }
        const cell = {
            key: filter[FIELD_VALUE_CONTENT],
            content: filter[FIELD_VALUE_CONTENT],
            shouldTruncate: true,
            isSortable: true,
        }
        head.cells.push(cell)
    })

    return head
}

const JQLBuilder = (filters) => {
    if (filters.length === 0) {
        return ''
    }

    let jql = 'PROJECT = ' + filters[0][FIELD_PROJECT].value

    filters.map((filter) => {
        jql += ` AND ${filter[FIELD_VALUE].value} ${filter[FIELD_OPERATOR].value} ${filter[FIELD_VALUE_CONTENT]}`
    })

    return jql
}

export const handler = resolver.getDefinitions()
