import React from "react";
import { Popover, Row } from "antd";
import { EnvironmentVariableType, EnvironmentVariableValue } from "backend/environment/types";
import { capitalize } from "lodash";
import "./variablePopover.scss";

interface VariablePopoverProps {
  hoveredVariable: string;
  popupPosition: { x: number; y: number };
  variables: Record<string, any>;
}

export const VariablePopover: React.FC<VariablePopoverProps> = ({ hoveredVariable, popupPosition, variables = {} }) => {
  return (
    <Popover
      content={
        <div className="variable-info-body">
          {variables[hoveredVariable] ? (
            <VariableInfo
              variable={{
                name: hoveredVariable,
                ...variables[hoveredVariable],
              }}
            />
          ) : (
            <AddNewVariable />
          )}
        </div>
      }
      open={!!hoveredVariable}
      destroyTooltipOnHide
      placement="bottom"
      showArrow={false}
      overlayClassName="variable-info-popover"
    >
      <div
        style={{
          position: "absolute",
          top: popupPosition?.y,
          left: popupPosition?.x,
          zIndex: 1000,
        }}
        className="variable-info-div"
      ></div>
    </Popover>
  );
};

const VariableInfo: React.FC<{
  variable: { name: string } & EnvironmentVariableValue;
}> = ({ variable }) => {
  const infoFields = [
    { label: "Type", value: capitalize(variable.type as string) },
    { label: "Initial Value", value: variable.syncValue },
    { label: "Current Value", value: variable.localValue },
  ];
  return (
    <>
      <Row className="variable-info-header">{variable.name}</Row>
      <div className="variable-info-content">
        {infoFields.map(({ label, value }) => (
          <React.Fragment key={label}>
            <div className="variable-info-title">{label}</div>
            <div className="variable-info-value">
              {label === "Type"
                ? value
                : variable.type === EnvironmentVariableType.Secret
                ? "•".repeat(String(value || "").length)
                : value}
            </div>
          </React.Fragment>
        ))}
      </div>
    </>
  );
};

const AddNewVariable: React.FC<{}> = () => {
  return (
    <>
      <Row className="variable-info-header">{"Variable is not defined or resolved"}</Row>
      <Row className="add-new-variable-info-content">
        {"Make sure that the variable is defined in the globals or any of the active environments."}
      </Row>
      {/* <RQButton
        block
        type="primary"
        className="add-new-variable-btn"
        onClick={() => {
          //TODO: Fix this to add new Variables
          addNewVariable({
            [variableName]: {
              syncValue: "",
              localValue: "",
              type: "string",
            },
          });
        }}
      >
        {"Add as a new variable"}
      </RQButton> */}
    </>
  );
};