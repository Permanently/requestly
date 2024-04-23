import { Button, Table } from "antd";
import { ContentListTableProps } from "componentsV2/ContentList";
import { TemplateRecord } from "../types";
import RuleTypeTag from "components/common/RuleTypeTag";
import { useNavigate } from "react-router-dom";
import { redirectToSharedListViewer } from "utils/RedirectionUtils";
import { useCallback } from "react";

interface Props {
  handlePreviewTemplateInModal: (template: TemplateRecord) => void;
}

const useTemplatesTableColumns: (props: Props) => ContentListTableProps<TemplateRecord>["columns"] = ({
  handlePreviewTemplateInModal,
}) => {
  const navigate = useNavigate();

  const handlePreviewTemplate = useCallback(
    (template: TemplateRecord) => {
      if (template.isSharedList) {
        redirectToSharedListViewer(navigate, template.data.shareId, template.data.sharedListName, true);
      } else {
        handlePreviewTemplateInModal(template);
      }
    },
    [navigate, handlePreviewTemplateInModal]
  );

  const columns: ContentListTableProps<TemplateRecord>["columns"] = [
    Table.SELECTION_COLUMN,
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 320,
      render: (name: string) => <div className="template-name">{name}</div>,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width: 420,
      render: (description: string) => <div className="template-description">{description}</div>,
    },
    {
      title: "Rule type",
      key: "rule",
      width: 160,
      render: (_: any, record: TemplateRecord) => {
        let ruleTypes: string[] = [];

        if (record.tags?.length) {
          ruleTypes = record.tags;
        } else if (!record.isSharedList) {
          ruleTypes = [record.data.ruleDefinition.ruleType];
        }

        return (
          <>
            {ruleTypes.map((ruleType, index) => (
              <div key={index}>
                <RuleTypeTag ruleType={ruleType} title={ruleType.toUpperCase()} />
              </div>
            ))}
          </>
        );
      },
    },
    {
      title: "",
      key: "action",
      width: 120,
      render: (_: any, record: TemplateRecord) => {
        return (
          <div className="templates-actions-container">
            <Button type="default" onClick={() => handlePreviewTemplate(record)}>
              Use this
            </Button>
          </div>
        );
      },
    },
  ];

  return columns;
};

export default useTemplatesTableColumns;
