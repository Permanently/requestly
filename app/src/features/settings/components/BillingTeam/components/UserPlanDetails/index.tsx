import { useSelector, useDispatch } from "react-redux";
import { getUserAuthDetails } from "store/selectors";
import { Col, Row, Space } from "antd";
import { TeamPlanStatus } from "../TeamPlanStatus";
import { RQButton } from "lib/design-system/components";
import { getLongFormatDateString } from "utils/DateTimeUtils";
import { getPrettyPlanName } from "utils/FormattingHelper";
import { getPlanNameFromId } from "utils/PremiumUtils";
import { MdDiversity1 } from "@react-icons/all-files/md/MdDiversity1";
import UpgradeIcon from "../../assets/upgrade.svg";
import { actions } from "store";
import { PRICING } from "features/pricing";
import "./index.scss";

export const UserPlanDetails = () => {
  const dispatch = useDispatch();
  const user = useSelector(getUserAuthDetails);

  return (
    <Col className="billing-teams-primary-card user-plan-detail-card">
      {user?.details?.isPremium ? (
        <>
          {" "}
          <Row gutter={8} align="middle" className="user-plan-card-header">
            <Col className="text-white text-bold">Your plan</Col>
            <Col>
              <TeamPlanStatus subscriptionStatus={user?.details?.planDetails.status} />
            </Col>
          </Row>
          <Col className="user-plan-card-grid">
            <div className="user-plan-card-grid-item">
              <Space direction="vertical" size={8}>
                {user?.details?.planDetails.status === "trialing" ? <div>One month free trial</div> : null}

                <div className="user-plan-card-plan-name">
                  {getPrettyPlanName(getPlanNameFromId(user?.details?.planDetails?.planName))} plan
                </div>
              </Space>
            </div>
            <div className="user-plan-card-grid-item">
              <Space direction="vertical" size={8}>
                <div className="user-plan-card-grid-item-label">
                  {user?.details?.planDetails.status === "trialing" ? "Trial" : "Plan"} start date
                </div>
                <div className="user-plan-date">
                  {getLongFormatDateString(new Date(user?.details?.planDetails?.subscription?.startDate))}
                </div>
              </Space>
            </div>
            <div className="user-plan-card-grid-item">
              <Space direction="vertical" size={8}>
                <div className="user-plan-card-grid-item-label">
                  {user?.details?.planDetails.status === "trialing" ? "Trial" : "Plan"} expire date
                </div>
                <div className="user-plan-date">
                  {getLongFormatDateString(new Date(user?.details?.planDetails?.subscription?.endDate))}
                </div>
              </Space>
            </div>
          </Col>
        </>
      ) : null}
      {user?.details?.planDetails?.planId !== PRICING.PLAN_NAMES.PROFESSIONAL ||
      user?.details?.planDetails.status === "trialing" ? (
        <Col className="user-plan-upgrade-card">
          <MdDiversity1 />
          <div className="title">Upgrade for more features 🚀</div>
          <div className="user-plan-upgrade-card-description">
            Your professional plan free trail will expire in 21 days. Please consider upgrading or connect directly with
            billing team admins already enjoying premium features.
          </div>
          <RQButton
            className="mt-16 user-plan-upgrade-card-btn"
            icon={<img src={UpgradeIcon} alt="upgrade" />}
            type="primary"
            onClick={() => {
              dispatch(
                actions.toggleActiveModal({
                  modalName: "pricingModal",
                  newValue: true,
                  newProps: { selectedPlan: null, source: "user_plan_billing_team" },
                })
              );
            }}
          >
            Upgrade
          </RQButton>
        </Col>
      ) : null}
    </Col>
  );
};
