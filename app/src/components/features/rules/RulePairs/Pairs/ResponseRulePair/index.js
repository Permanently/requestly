import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Row, Col } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentlySelectedRuleData, getResponseRuleResourceType } from "store/selectors";
import RequestSourceRow from "../Rows/RowsMarkup/RequestSourceRow";
import ResponseBodyRow from "../Rows/RowsMarkup/ResponseBodyRow";
import ResponseStatusCodeRow from "../Rows/RowsMarkup/ResponseStatusCodeRow";
import GraphqlRequestPayload from "./GraphqlRequestPayload";
import { ResponseRuleResourceType } from "types/rules";
import getObjectValue from "../../Filters/actions/getObjectValue";
import APP_CONSTANTS from "config/constants";
import "./ResponseRulePair.css";
import { RuleType } from "features/rules";
import { set } from "lodash";
import { setCurrentlySelectedRule } from "components/features/rules/RuleBuilder/actions";

const {
  PATH_FROM_PAIR: { SOURCE_REQUEST_PAYLOAD_KEY, SOURCE_REQUEST_PAYLOAD_VALUE, SOURCE_REQUEST_PAYLOAD_OPERATOR },
} = APP_CONSTANTS;

const ResponseRulePair = ({ isSuperRule, ruleId, pair, pairIndex, ruleDetails, isInputDisabled }) => {
  const dispatch = useDispatch();
  const currentlySelectedRuleData = useSelector(getCurrentlySelectedRuleData);
  const responseRuleResourceType = useSelector(getResponseRuleResourceType);
  console.log({ pair });

  const currentPayloadKey = useMemo(
    () => getObjectValue(currentlySelectedRuleData, pairIndex, SOURCE_REQUEST_PAYLOAD_KEY),
    [pairIndex, currentlySelectedRuleData]
  );

  const currentPayloadOperator = useMemo(
    () => getObjectValue(currentlySelectedRuleData, pairIndex, SOURCE_REQUEST_PAYLOAD_OPERATOR),
    [pairIndex, currentlySelectedRuleData]
  );

  const currentPayloadValue = useMemo(
    () => getObjectValue(currentlySelectedRuleData, pairIndex, SOURCE_REQUEST_PAYLOAD_VALUE),
    [pairIndex, currentlySelectedRuleData]
  );
  const updateSuperRuleResourceType = useCallback(
    (resourceType, clearGraphqlRequestPayload = false) => {
      if (!currentlySelectedRuleData) {
        return;
      }

      const pairIndex = 0; // response rule will only have one pair
      const copyOfCurrentlySelectedRule = JSON.parse(JSON.stringify(currentlySelectedRuleData));

      const updatedRule = {
        ...currentlySelectedRuleData,
        pairs: [
          {
            ...copyOfCurrentlySelectedRule.pairs[pairIndex],
            [ruleId]: {
              ...copyOfCurrentlySelectedRule?.pairs?.[pairIndex][ruleId],
              response: {
                ...copyOfCurrentlySelectedRule?.pairs?.[pairIndex][ruleId].response,
                resourceType,
              },
            },
          },
        ],
      };

      console.log({ updatedRule });
      setCurrentlySelectedRule(dispatch, updatedRule);
    },
    [dispatch, currentlySelectedRuleData, ruleId]
  );

  useEffect(() => {
    if (currentlySelectedRuleData?.ruleType === RuleType.SUPER) {
      updateSuperRuleResourceType(ResponseRuleResourceType.REST_API);
      return;
    }
  }, [currentlySelectedRuleData?.ruleType]);

  const [gqlOperationFilter, setGqlOperationFilter] = useState({
    key: currentPayloadKey,
    operator: currentPayloadOperator,
    value: currentPayloadValue,
  });

  return isSuperRule ? (
    <React.Fragment>
      {responseRuleResourceType === ResponseRuleResourceType.GRAPHQL_API && (
        <Row className="response-rule-inputs-row">
          <Col span={24}>
            <GraphqlRequestPayload
              ruleId={ruleId}
              isSuperRule={isSuperRule}
              pairIndex={pairIndex}
              gqlOperationFilter={gqlOperationFilter}
              setGqlOperationFilter={setGqlOperationFilter}
            />
          </Col>
        </Row>
      )}
      <Row className="response-rule-inputs-row">
        <Col span={24}>
          <ResponseStatusCodeRow
            ruleId={ruleId}
            isSuperRule={isSuperRule}
            rowIndex={2}
            pair={pair}
            pairIndex={pairIndex}
            isInputDisabled={isInputDisabled}
          />
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <ResponseBodyRow
            ruleId={ruleId}
            isSuperRule={isSuperRule}
            rowIndex={2}
            pair={pair}
            pairIndex={pairIndex}
            ruleDetails={ruleDetails}
            isInputDisabled={isInputDisabled}
          />
        </Col>
      </Row>
    </React.Fragment>
  ) : (
    <React.Fragment>
      <Row>
        <Col span={24}>
          <RequestSourceRow
            rowIndex={1}
            pair={pair}
            pairIndex={pairIndex}
            ruleDetails={ruleDetails}
            isInputDisabled={isInputDisabled}
          />
        </Col>
      </Row>
      {responseRuleResourceType === ResponseRuleResourceType.GRAPHQL_API && (
        <Row className="response-rule-inputs-row">
          <Col span={24}>
            <GraphqlRequestPayload
              pairIndex={pairIndex}
              gqlOperationFilter={gqlOperationFilter}
              setGqlOperationFilter={setGqlOperationFilter}
            />
          </Col>
        </Row>
      )}
      <Row className="response-rule-inputs-row">
        <Col span={24}>
          <ResponseStatusCodeRow rowIndex={2} pair={pair} pairIndex={pairIndex} isInputDisabled={isInputDisabled} />
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <ResponseBodyRow
            rowIndex={2}
            pair={pair}
            pairIndex={pairIndex}
            ruleDetails={ruleDetails}
            isInputDisabled={isInputDisabled}
          />
        </Col>
      </Row>
    </React.Fragment>
  );
};

export default ResponseRulePair;
