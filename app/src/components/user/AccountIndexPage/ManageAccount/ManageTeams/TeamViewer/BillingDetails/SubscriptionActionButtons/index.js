import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Button } from "antd";
import APP_CONSTANTS from "../../../../../../../../config/constants";
import ContactUsModal from "components/landing/contactUsModal";
import CancelPlanModal from "./CancelPlanModal";
import { trackUpgradeWorkspaceClicked } from "modules/analytics/events/common/teams";
import { redirectToPricingPlans } from "utils/RedirectionUtils";
import { actions } from "store";

const SubscriptionActionButtons = ({ isSubscriptionActive = false }) => {
  const dispatch = useDispatch();
  const [isContactUsModalActive, setIsContactUsModalActive] = useState(false);
  const [isCancelPlanModalActive, setIsCancelPlanModalActive] = useState(false);

  const toggleContactUsModal = () => {
    setIsContactUsModalActive(!isContactUsModalActive);
  };

  const handleCancelPlanModalClose = () => {
    setIsCancelPlanModalActive(false);
  };

  return (
    <div>
      {isSubscriptionActive ? (
        <Button danger className="billing-cancel-plan-btn" onClick={() => setIsCancelPlanModalActive(true)}>
          Cancel plan
        </Button>
      ) : (
        <Button
          type="primary"
          onClick={() => {
            dispatch(actions.toggleActiveModal({ modalName: "pricingModal", newValue: true }));
            trackUpgradeWorkspaceClicked();
          }}
        >
          Upgrade
        </Button>
      )}

      <Button
        target="_blank"
        rel="noreferrer"
        className="billing-learn-more-btn"
        href={APP_CONSTANTS.PATHS.PRICING.ABSOLUTE}
      >
        Learn more
      </Button>

      {isContactUsModalActive ? (
        <ContactUsModal isOpen={isContactUsModalActive} handleToggleModal={toggleContactUsModal} />
      ) : null}

      {isCancelPlanModalActive ? (
        <CancelPlanModal isOpen={isCancelPlanModalActive} handleToggleModal={handleCancelPlanModalClose} />
      ) : null}
    </div>
  );
};

export default SubscriptionActionButtons;
