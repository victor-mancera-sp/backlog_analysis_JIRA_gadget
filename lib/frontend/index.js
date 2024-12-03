import { invoke, view } from "@forge/bridge";
import ForgeReconciler, { Button, Form, FormFooter, FormSection, Label, RequiredAsterisk, Text, Textfield, useForm, useProductContext } from "@forge/react";
import React, { useEffect, useState } from "react";
const FIELD_NAME = "field-name";
export const Edit = () => {
  const {
    handleSubmit,
    register,
    getFieldId
  } = useForm();
  const configureGadget = data => {
    view.submit(data);
  };
  return <Form onSubmit={handleSubmit(configureGadget)}>
      <FormSection>
        <Label labelFor={getFieldId(FIELD_NAME)}>
          Value
          <RequiredAsterisk />
        </Label>
        <Textfield {...register(FIELD_NAME, {
        required: true
      })} />
      </FormSection>
      <FormFooter>
        <Button appearance="primary" type="submit">
          Submit
        </Button>
      </FormFooter>
    </Form>;
};
const View = () => {
  const [data, setData] = useState(null);
  const context = useProductContext();
  useEffect(() => {
    invoke('getText', {
      example: 'my-invoke-variable'
    }).then(setData);
  }, []);
  useEffect(() => {
    invoke('getSearch', {
      Project: ['TEST'],
      Labels: ['sp_config_drafts']
    });
  }, []);
  if (!context) {
    return "Loading...";
  }
  const {
    extension: {
      gadgetConfiguration
    }
  } = context;
  return <>
      <Text>Value: {gadgetConfiguration[FIELD_NAME]}</Text>
      <Text>{data ? data : 'Loading...'}</Text>
    </>;
};
const App = () => {
  const context = useProductContext();
  if (!context) {
    return "Loading...";
  }
  return context.extension.entryPoint === "edit" ? <Edit /> : <View />;
};
ForgeReconciler.render(<React.StrictMode>
    <App />
  </React.StrictMode>);