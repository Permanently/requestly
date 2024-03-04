import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useFeatureLimiter } from "hooks/featureLimiter/useFeatureLimiter";
import { useFeatureIsOn } from "@growthbook/growthbook-react";
import { Button, Col, List, Row, Space } from "antd";
import { toast } from "utils/Toast.js";
import { AiOutlineWarning } from "@react-icons/all-files/ai/AiOutlineWarning";
import { BsFileEarmarkCheck } from "@react-icons/all-files/bs/BsFileEarmarkCheck";
import {
  getAllRules,
  getAppMode,
  getIsRefreshRulesPending,
  getUserAttributes,
  getUserAuthDetails,
} from "store/selectors";
import { trackRQLastActivity } from "utils/AnalyticsUtils";
import { actions } from "store";
import { processDataToImport, addRulesAndGroupsToStorage } from "./actions";
import { SOURCE } from "modules/analytics/events/common/constants";
import { ImportFromCharlesModal } from "../ImportFromCharlesModal";
import { RQModal } from "lib/design-system/components";
import { FilePicker } from "components/common/FilePicker";
import { FeatureLimitType } from "hooks/featureLimiter/types";
import { RULE_IMPORT_TYPE } from "features/rules";
import { CONSTANTS as GLOBAL_CONSTANTS } from "@requestly/requestly-core";
import Logger from "lib/logger";
import {
  trackRulesJsonParsed,
  trackRulesImportFailed,
  trackRulesImportCompleted,
  trackCharlesSettingsImportStarted,
} from "modules/analytics/events/features/rules";
import { trackUpgradeToastViewed } from "features/pricing/components/PremiumFeature/analytics";

export const ImportRulesModal = ({ toggle: toggleModal, isOpen }) => {
  //Global State
  const dispatch = useDispatch();
  const appMode = useSelector(getAppMode);
  const allRules = useSelector(getAllRules);
  const user = useSelector(getUserAuthDetails);
  const isRulesListRefreshPending = useSelector(getIsRefreshRulesPending);
  const userAttributes = useSelector(getUserAttributes);
  const { getFeatureLimitValue } = useFeatureLimiter();
  const isCharlesImportFeatureFlagOn = useFeatureIsOn("import_rules_from_charles");

  //Component State
  const [dataToImport, setDataToImport] = useState(false);
  const [processingDataToImport, setProcessingDataToImport] = useState(false);
  const [rulesToImportCount, setRulesToImportCount] = useState(false);
  const [groupsToImportCount, setGroupsToImportCount] = useState(false);
  const [conflictingRecords, setConflictingRecords] = useState([]);
  const [showImportOptions, setShowImportOptions] = useState(true);
  const [isImportFromCharlesModalOpen, setIsImportFromCharlesModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const isImportLimitReached = useMemo(() => {
    return (
      getFeatureLimitValue(FeatureLimitType.num_rules) < rulesToImportCount && userAttributes?.days_since_install > 3
    );
  }, [rulesToImportCount, getFeatureLimitValue, userAttributes?.days_since_install]);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      //Ignore other uploaded files
      const file = acceptedFiles[0];

      const reader = new FileReader();

      reader.onabort = () => toggleModal();
      reader.onerror = () => toggleModal();
      reader.onload = () => {
        //Render the loader
        setProcessingDataToImport(true);
        let parsedArray = [];
        try {
          parsedArray = JSON.parse(reader.result);
          //Start processing data
          processDataToImport(parsedArray, user, allRules).then((result) => {
            setDataToImport(result.data);
            setRulesToImportCount(result.rulesCount);
            setGroupsToImportCount(result.groupsCount);
            trackRulesJsonParsed({
              parsed_rules_count: result.rulesCount,
              parsed_groups_count: result.groupsCount,
              successful: true,
            });
          });
        } catch (error) {
          Logger.log(error);
          alert("Imported file doesn't match Requestly format. Please choose another file.");
          trackRulesJsonParsed({
            successful: false,
          });
          trackRulesImportFailed("json_parse_failed");
          toggleModal();
        }
      };
      reader.readAsText(file);
    },
    [user, allRules, toggleModal]
  );

  const renderFilePicker = () => {
    return (
      <FilePicker
        onFilesDrop={onDrop}
        loaderMessage="Processing rules..."
        isProcessing={processingDataToImport}
        title="Drag and drop your JSON file"
      />
    );
  };

  const RenderConflictingRules = () => {
    if (conflictingRecords.length !== 0) {
      return (
        <>
          <List
            size="small"
            dataSource={conflictingRecords.slice(0, 5)}
            renderItem={(item) => <div style={{ marginLeft: "3.7rem", textAlign: "left" }}>{item.name}</div>}
          />
          {conflictingRecords.length > 5 ? (
            <h4>+ {conflictingRecords.length - 5} more rules are in conflict. Select an option to continue?</h4>
          ) : (
            <h4 style={{ marginTop: "2rem" }}>Above rules are in conflict. Select an option to continue?</h4>
          )}
        </>
      );
    }
    return null;
  };

  const renderImportConfirmation = () => {
    return (rulesToImportCount && rulesToImportCount > 0) || (groupsToImportCount && groupsToImportCount > 0) ? (
      <Col lg="12" md="12" xl="12" sm="12" xs="12" className="text-center" style={{ textAlign: "center" }}>
        <h1 className="display-2">
          <BsFileEarmarkCheck className="success" />
        </h1>
        <h4>
          Successfully parsed{" "}
          {rulesToImportCount > 0 && rulesToImportCount - conflictingRecords.length > 0
            ? `${rulesToImportCount - (conflictingRecords.length || 0)} rules`
            : null}
          {groupsToImportCount > 0 ? ", " + groupsToImportCount + " groups" : null}{" "}
          {conflictingRecords.length > 0 ? "and " + conflictingRecords.length + " conflicting rules." : null}
        </h4>
        <RenderConflictingRules />
      </Col>
    ) : (
      renderWarningMessage()
    );
  };

  const doImportRules = useCallback(
    (natureOfImport) => {
      setIsImporting(true);
      addRulesAndGroupsToStorage(appMode, dataToImport)
        .then(async () => {
          dispatch(
            actions.updateRefreshPendingStatus({
              type: "rules",
              newValue: !isRulesListRefreshPending,
            })
          );
          toggleModal();
        })
        .then(() => {
          toast.info(`Successfully imported rules`);
          trackRQLastActivity("rules_imported");
          trackRulesImportCompleted({
            count: rulesToImportCount,
            nature_of_import: natureOfImport,
            conflicting_rules_count: conflictingRecords?.length || 0,
          });
        })
        .catch((e) => {
          trackRulesImportFailed("unsuccessful_save");
        })
        .finally(() => setIsImporting(false));
    },
    [appMode, dataToImport, dispatch, isRulesListRefreshPending, rulesToImportCount, toggleModal, conflictingRecords]
  );

  const renderImportRulesBtn = () => {
    if (
      dataToImport &&
      processingDataToImport &&
      rulesToImportCount &&
      rulesToImportCount > 0 &&
      conflictingRecords.length !== 0
    ) {
      return (
        <Row className="rq-modal-footer">
          <Space className="ml-auto">
            <Button
              color="primary"
              data-dismiss="modal"
              type="button"
              onClick={() => {
                handleRulesAndGroupsImport(RULE_IMPORT_TYPE.OVERWRITE);
              }}
            >
              Overwrite Conflicting Rules
            </Button>
            <Button
              color="primary"
              data-dismiss="modal"
              type="button"
              onClick={() => {
                handleRulesAndGroupsImport(RULE_IMPORT_TYPE.DUPLICATE);
              }}
            >
              Duplicate Conflicting Rules
            </Button>
          </Space>
        </Row>
      );
    }
    return dataToImport &&
      processingDataToImport &&
      rulesToImportCount &&
      rulesToImportCount > 0 &&
      conflictingRecords.length === 0 ? (
      <Row className="rq-modal-footer">
        <Button
          type="primary"
          className="ml-auto"
          data-dismiss="modal"
          loading={isImporting}
          onClick={() => handleRulesAndGroupsImport(RULE_IMPORT_TYPE.NORMAL)}
        >
          Import
        </Button>
      </Row>
    ) : null;
  };

  const handleRulesAndGroupsImport = useCallback(
    (importType) => {
      if (isImportLimitReached) {
        toast.error(
          "The rules cannot be imported due to exceeding free plan limits. To proceed, consider upgrading your plan.",
          4
        );
        trackUpgradeToastViewed(rulesToImportCount, "import_rules_modal");
        return;
      }

      if (importType === RULE_IMPORT_TYPE.OVERWRITE || importType === RULE_IMPORT_TYPE.NORMAL) {
        // by default overwrite is true so we dont need to process the importData again
        doImportRules(importType);
      } else {
        processDataToImport(dataToImport, user, allRules, false);
        doImportRules(importType);
      }
    },
    [isImportLimitReached, allRules, dataToImport, doImportRules, user, rulesToImportCount]
  );

  const renderWarningMessage = () => {
    return (
      <Col lg="12" md="12" xl="12" sm="12" xs="12" className="text-center">
        <h4>
          <AiOutlineWarning /> Could not find valid data in this file. Please try another
        </h4>
      </Col>
    );
  };

  useEffect(() => {
    if (dataToImport) {
      dataToImport.forEach((data) => {
        const duplicateDataIndex = allRules.findIndex((rule) => {
          return rule.id === data.id;
        });
        if (duplicateDataIndex !== -1) {
          const duplicateData = allRules[duplicateDataIndex];
          setConflictingRecords((prev) => {
            if (prev.findIndex((rule) => rule.id === duplicateData.id) === -1) {
              return [...prev, { id: duplicateData.id, name: duplicateData.name }];
            } else return [...prev];
          });
        }
      });
    }
  }, [allRules, dataToImport]);

  const toggleImportFromCharlesModal = useCallback(() => {
    if (isImportFromCharlesModalOpen) {
      toggleModal();
    } else {
      trackCharlesSettingsImportStarted(SOURCE.RULES_LIST);
    }

    setIsImportFromCharlesModalOpen((prev) => !prev);
  }, [toggleModal, isImportFromCharlesModalOpen]);

  const handleRegularRuleImportClick = () => {
    setShowImportOptions(false);
  };

  const modifyModalContentForCharlesImportOption =
    isCharlesImportFeatureFlagOn && showImportOptions && appMode === GLOBAL_CONSTANTS.APP_MODES.DESKTOP;

  return (
    <>
      {isImportFromCharlesModalOpen ? (
        <ImportFromCharlesModal
          isOpen={isImportFromCharlesModalOpen}
          toggle={toggleImportFromCharlesModal}
          triggeredBy={SOURCE.RULES_LIST}
        />
      ) : null}

      <RQModal
        open={isOpen}
        onCancel={toggleModal}
        style={{ display: isImportFromCharlesModalOpen ? "none" : "block" }}
      >
        <div className="rq-modal-content">
          <Row align="middle" justify="center" className="header mb-16">
            {modifyModalContentForCharlesImportOption ? (
              <span>Select the type of rules you want to import</span>
            ) : (
              <span>Import Rules</span>
            )}
          </Row>
          {modifyModalContentForCharlesImportOption ? (
            <>
              <Row align="middle" justify="center">
                <Button type="default" onClick={handleRegularRuleImportClick}>
                  Import Requestly rules (JSON file)
                </Button>
              </Row>
              <center style={{ margin: "8px 0" }} className="text-gray">
                or
              </center>
              <Row align="middle" justify="center">
                <Button type="default" onClick={toggleImportFromCharlesModal}>
                  Import Charles Proxy settings (XML file)
                </Button>
              </Row>
            </>
          ) : (
            <>{dataToImport ? renderImportConfirmation() : renderFilePicker()}</>
          )}
        </div>
        {renderImportRulesBtn()}
      </RQModal>
    </>
  );
};
