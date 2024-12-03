import { invoke, view } from '@forge/bridge'
import ForgeReconciler, {
    Button,
    ButtonGroup,
    Checkbox,
    DynamicTable,
    Form,
    FormFooter,
    FormSection,
    Label,
    Link,
    RequiredAsterisk,
    Select,
    Text,
    Textfield,
    useProductContext,
} from '@forge/react'
import { cloneDeep } from 'lodash'
import React, { useEffect, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'

const FIELD_VALUE = 'field-value'
const FIELD_PROJECT = 'field-project'
const FIELD_OPERATOR = 'field-operator'
const FIELD_VALUE_CONTENT = 'field-value-content'
const FIELD_ONLY_ROW = 'field-only-row'
const FIELD_ONLY_COLUMN = 'field-only-column'

const operators = [
    {
        label: 'equals',
        value: '=',
    },
    {
        label: 'different than',
        value: '!=',
    },
    {
        label: 'contains',
        value: 'contains',
    },
    {
        label: 'does not contain',
        value: 'does not contain',
    },
    {
        label: 'less than',
        value: 'less than',
    },
    {
        label: 'greater than',
        value: 'greater than',
    },

    {
        label: 'is',
        value: 'is',
    },
    {
        label: 'is not',
        value: 'is not',
    },
]

export const Edit = () => {
    const {
        handleSubmit,
        control,
        formState: { errors },
    } = useForm()

    const context = useProductContext()

    const { fields, append, remove, replace } = useFieldArray({
        control,
        name: 'filters',
    })

    const [projects, setProjects] = useState([])
    const [ticketFields, setTicketFields] = useState([])

    useEffect(() => {
        invoke('getProjects').then(setProjects)
        invoke('getFields').then(setTicketFields)
    }, [])

    useEffect(() => {
        if (context) {
            if (context.extension.gadgetConfiguration) {
                replace(context.extension.gadgetConfiguration.submittedFilters)
            }
        }
    }, [context])

    const onSubmit = (data) => {
        const submittedFiltersJSON = {
            submittedFilters: data.filters,
            projects: projects,
            ticketFields: ticketFields,
        }
        configureGadget(submittedFiltersJSON)
    }

    const configureGadget = (data) => {
        try {
            view.submit(data)
        } catch (error) {
            console.error('Error submitting data to view:', error)
        }
    }

    const addFilter = () => {
        append({
            [FIELD_PROJECT]: '',
            [FIELD_VALUE]: '',
            [FIELD_OPERATOR]: '',
            [FIELD_VALUE_CONTENT]: '',
            [FIELD_ONLY_ROW]: false,
            [FIELD_ONLY_COLUMN]: false,
        })
    }

    if (!context) {
        return 'Loading...'
    }
    const {
        // eslint-disable-next-line no-unused-vars
        extension: { gadgetConfiguration },
    } = context

    return (
        <Form onSubmit={handleSubmit(onSubmit)}>
            {projects.length === 0 || ticketFields === 0 ? (
                <Text>Loading...</Text>
            ) : (
                fields.map((field, index) => (
                    <FilterFormSection
                        key={field.id}
                        index={index}
                        control={control}
                        errors={errors}
                        projects={projects}
                        ticketFields={ticketFields}
                        remove={remove}
                    />
                ))
            )}
            <FormFooter>
                <ButtonGroup>
                    <Button appearance="secondary" onClick={addFilter}>
                        Add another filter
                    </Button>
                    <Button appearance="primary" type="submit">
                        Submit
                    </Button>
                </ButtonGroup>
            </FormFooter>
        </Form>
    )
}

const FilterFormSection = ({
    control,
    index,
    errors,
    projects,
    ticketFields,
    remove,
}) => {
    return (
        <FormSection>
            <Label>
                Project
                <RequiredAsterisk />
            </Label>
            <Controller
                control={control}
                name={'filters.' + index + '.' + FIELD_PROJECT}
                rules={{ required: true }}
                render={({ field: { ...field } }) => (
                    <Select
                        id={field.id}
                        value={field.value}
                        onChange={field.onChange}
                        options={projects}
                        placeholder={
                            projects.length === 0
                                ? 'Loading projects...'
                                : 'Select a project'
                        }
                        isDisabled={projects.length === 0}
                    />
                )}
            />
            {errors[FIELD_PROJECT] && <Text>This field is required</Text>}
            <Label>
                Field
                <RequiredAsterisk />
            </Label>
            <Controller
                control={control}
                name={'filters.' + index + '.' + FIELD_VALUE}
                rules={{ required: true }}
                render={({ field: { ...field } }) => (
                    <Select
                        id={field.id}
                        value={field.value}
                        onChange={field.onChange}
                        options={ticketFields}
                        placeholder={
                            ticketFields.length === 0
                                ? 'Loading fields...'
                                : 'Select a field'
                        }
                    />
                )}
            />
            {errors[FIELD_VALUE] && <Text>This field is required</Text>}
            <Label>
                Operator
                <RequiredAsterisk />
            </Label>
            <Controller
                control={control}
                name={'filters.' + index + '.' + FIELD_OPERATOR}
                rules={{ required: true }}
                render={({ field: { ...field } }) => (
                    <Select
                        id={field.id}
                        value={field.value}
                        onChange={field.onChange}
                        options={operators}
                        placeholder="Select an operator"
                    />
                )}
            />
            {errors[FIELD_OPERATOR] && <Text>This field is required</Text>}
            <Label>
                Value
                <RequiredAsterisk />
            </Label>
            <Controller
                control={control}
                name={'filters.' + index + '.' + FIELD_VALUE_CONTENT}
                rules={{ required: true }}
                render={({ field: { ...field } }) => (
                    <Textfield
                        id={field.id}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Enter a value"
                    />
                )}
            />
            {errors[FIELD_VALUE_CONTENT] && <Text>This field is required</Text>}
            <Label>Only Row</Label>
            <Controller
                control={control}
                name={'filters.' + index + '.' + FIELD_ONLY_ROW}
                render={({ field: { ...field } }) => (
                    <Checkbox
                        id={field.id}
                        value={field.value ? 'checked' : 'default'}
                        onChange={field.onChange}
                        isChecked={field.value}
                    />
                )}
            />
            <Label>Only Column</Label>
            <Controller
                control={control}
                name={'filters.' + index + '.' + FIELD_ONLY_COLUMN}
                render={({ field: { ...field } }) => (
                    <Checkbox
                        id={field.id}
                        value={field.value ? 'checked' : 'default'}
                        onChange={field.onChange}
                        isChecked={field.value}
                    />
                )}
            />
            <Button appearance="secondary" onClick={() => remove(index)}>
                Remove filter
            </Button>
        </FormSection>
    )
}

const View = () => {
    const [data, setData] = useState(null)
    const [modifiedData, setModifiedData] = useState(null)
    const [highlight, setHighlight] = useState([])
    const context = useProductContext()

    useEffect(() => {
        invoke('getIssuesData').then(setData)
    }, [])

    useEffect(() => {
        if (data === null) {
            return
        }
        let total = -1

        let copyData = cloneDeep(data)
        copyData.rows.forEach((row, index) => {
            if (row.total > total) {
                setHighlight([index])
                total = row.total
            }

            row.cells.forEach((cell) => {
                if (cell.shouldBeLink) {
                    cell.content = <Link href={cell.link}>{cell.content}</Link>
                }
            })
        })

        setModifiedData(copyData)
    }, [data])

    if (!context) {
        return 'Loading...'
    }
    const {
        // eslint-disable-next-line no-unused-vars
        extension: { gadgetConfiguration },
    } = context

    return (
        <DynamicTable
            isLoading={modifiedData === null}
            head={modifiedData && modifiedData.head}
            rows={modifiedData && modifiedData.rows}
            rowsPerPage={10}
            isRankable
            highlightedRowIndex={highlight}
        />
    )
}

const App = () => {
    const context = useProductContext()

    if (!context) {
        return 'Loading...'
    }
    return context.extension.entryPoint === 'edit' ? <Edit /> : <View />
}

ForgeReconciler.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)
