import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getUserAuthDetails } from "store/selectors";
import { getAvailableTeams } from "store/features/teams/selectors";
import { Col, Skeleton } from "antd";
import { CreateWorkspaceView } from "./components/CreateWorkspaceView";
import { TeamsListView } from "./components/TeamsListView";
import { getPendingInvites } from "backend/workspace";
import { isCompanyEmail } from "utils/FormattingHelper";
import Logger from "lib/logger";

export const TeamsCard: React.FC = () => {
  const user = useSelector(getUserAuthDetails);
  const availableTeams = useSelector(getAvailableTeams);
  const [pendingInvites, setPendingInvites] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user.loggedIn) {
      setIsLoading(false);
      return;
    }
    getPendingInvites({ email: true, domain: true })
      .then((res: any) => {
        setPendingInvites(res?.pendingInvites ?? []);
      })
      .catch((e) => {
        Logger.error(e);
        setPendingInvites([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [user.loggedIn]);

  if (!user.loggedIn) return <CreateWorkspaceView />;
  if (isLoading)
    return (
      <Col style={{ padding: "20px 1rem" }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Col>
    );
  if (pendingInvites?.length > 0)
    return (
      <TeamsListView
        heading="We found your team on Requestly"
        subheading=" Join your team’s workspaces and access shared rules, mock APIs, replays, and more."
        pendingInvites={pendingInvites}
      />
    );
  if (availableTeams?.length > 0) return <TeamsListView heading="Your workspaces" />;
  // TODO: Add default workspace view after onboarding is 100% rolled out
  if (isCompanyEmail(user?.details?.profile?.email)) return <CreateWorkspaceView />;
  else return <CreateWorkspaceView />;
};
