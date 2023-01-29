import React, { useContext, useMemo, useCallback } from "react";
import SwipeableViews from "react-swipeable-views";
import { virtualize, bindKeyboard } from "react-swipeable-views-utils";
import SentimentVeryDissatisfiedIcon from "@mui/icons-material/SentimentVeryDissatisfied";
import { FixedSizeList } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import memorize from "memoize-one";
import { useTranslation } from "react-i18next";
import { styled } from "@mui/material/styles";
import { Box, SxProps, Theme, Typography } from "@mui/material";

import AppContext from "../../AppContext";
import { isHoliday, isRouteAvaliable } from "../../timetable";
import type { BoardTabType } from "./BoardTabbar";
import { TRANSPORT_SEARCH_OPTIONS, TRANSPORT_ORDER } from "../../constants";
import RouteRowList from "./RouteRowList";
import { routeSortFunc } from "../../utils";

interface SwipeableRouteBoardProps {
  boardTab: BoardTabType;
  onChangeTab: (v: string) => void;
}

const SwipeableRoutesBoard = ({
  boardTab,
  onChangeTab,
}: SwipeableRouteBoardProps) => {
  const {
    searchRoute,
    db: { holidays, routeList },
    isRouteFilter,
    busSortOrder,
    vibrateDuration,
  } = useContext(AppContext);
  const isTodayHoliday = useMemo(
    () => isHoliday(holidays, new Date()),
    [holidays]
  );
  const { t } = useTranslation();

  const coItemDataList = useMemo(() => {
    const baseRouteList = Object.entries(routeList)
      // filter by route no
      .filter(
        ([routeNo, { stops, co }]) =>
          routeNo.startsWith(searchRoute.toUpperCase()) &&
          (stops[co[0]] == null || stops[co[0]].length > 0)
      )
      // filter non available route
      .filter(
        ([routeNo, { freq }]) =>
          !isRouteFilter || isRouteAvaliable(routeNo, freq, isTodayHoliday)
      )
      .sort((a, b) => routeSortFunc(a, b, TRANSPORT_ORDER[busSortOrder]));
    return Object.entries(TRANSPORT_SEARCH_OPTIONS).map(
      ([tab, searchOptions]) =>
        createItemData(
          baseRouteList.filter(([routeNo, { co }]) =>
            co.some((c) => searchOptions.includes(c))
          ),
          vibrateDuration
        )
    );
  }, [
    routeList,
    isTodayHoliday,
    searchRoute,
    isRouteFilter,
    vibrateDuration,
    busSortOrder,
  ]);

  const ListRenderer = useCallback(
    ({ key, index }) => (
      <React.Fragment key={key}>
        {!!coItemDataList[index].routeList.length ? (
          <AutoSizer>
            {({ height, width }) => (
              <FixedSizeList
                height={height * 0.98}
                itemCount={coItemDataList[index].routeList.length}
                itemSize={64}
                width={width}
                itemData={coItemDataList[index]}
                className={classes.root}
              >
                {RouteRowList}
              </FixedSizeList>
            )}
          </AutoSizer>
        ) : (
          <Box sx={noResultSx}>
            <SentimentVeryDissatisfiedIcon fontSize="small" />
            <Box>
              <Typography variant="h6">"{searchRoute}"</Typography>
              <Typography variant="h6">
                {t("route-search-no-result")}
              </Typography>
            </Box>
          </Box>
        )}
      </React.Fragment>
    ),
    [coItemDataList, searchRoute, t]
  );

  return useMemo(
    () => (
      <>
        {navigator.userAgent === "prerendering" ? (
          <PrerenderList className={classes.prerenderList}>
            {coItemDataList[0].routeList.map((data, idx) => (
              <RouteRowList
                data={coItemDataList[0]}
                key={`route-${idx}`}
                index={idx}
                style={null} // required by react-window
              />
            ))}
          </PrerenderList>
        ) : (
          <VirtualizeSwipeableViews
            index={BOARD_TAB.indexOf(boardTab)}
            onChangeIndex={(idx) => {
              onChangeTab(BOARD_TAB[idx]);
            }}
            style={{ flex: 1, display: "flex" }}
            containerStyle={{ flex: 1 }}
            slideCount={coItemDataList.length}
            overscanSlideAfter={1}
            overscanSlideBefore={1}
            slideRenderer={ListRenderer}
            enableMouseEvents={true}
          />
        )}
      </>
    ),
    [ListRenderer, coItemDataList, onChangeTab, boardTab]
  );
};

const createItemData = memorize((routeList, vibrateDuration) => ({
  routeList,
  vibrateDuration,
}));

const VirtualizeSwipeableViews = bindKeyboard(virtualize(SwipeableViews));

export default SwipeableRoutesBoard;

const BOARD_TAB = ["all", "bus", "minibus", "lightRail", "mtr"];

const PREFIX = "routeBoard";

const classes = {
  root: `${PREFIX}-root`,
  prerenderList: `${PREFIX}-prerenderList`,
  noResult: `${PREFIX}-noResult`,
};

const PrerenderList = styled("div")(({ theme }) => ({
  [`&.${classes.prerenderList}`]: {
    height: "100%",
    overflowY: "scroll",
  },
}));

const noResultSx: SxProps<Theme> = {
  height: "140px",
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  [`& .MuiSvgIcon-root`]: {
    fontSize: "4rem",
    mr: 2,
  },
};
