import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import React, { useImperativeHandle } from 'react';
import 'react-tabs/style/react-tabs.css';
import { useStores } from 'src/store';
import { TChartProps } from 'src/types';
import { safeParse } from 'src/utils';
import { usePrevious } from '../hooks';

/* css + scss */
import '../../sass/main.scss';
import { initGA, logPageView } from '../utils/ga';
import Barrier from './Barrier';
import BottomWidget from './BottomWidget';
import BottomWidgetsContainer from './BottomWidgetsContainer';
import ChartControls from './ChartControls';
import ChartFooter from './ChartFooter';
import ChartTitle from './ChartTitle';
import Crosshair from './Crosshair';
import HighestLowestMarker from './HighestLowestMarker';
import IndicatorPredictionDialog from './IndicatorPredictionDialog';
import Loader from './Loader';
import NavigationWidget from './NavigationWidget';
import PaginationLoader from './PaginationLoader';
import RenderInsideChart from './RenderInsideChart';
import SettingsDialog from './SettingsDialog';
import ScrollToRecent from './ScrollToRecent';

const Chart = React.forwardRef((props: TChartProps, ref) => {
    const { chart, drawTools, studies, chartSetting, chartType, state, loader, chartAdapter, crosshair, timeperiod } =
        useStores();
    const { chartId, init, destroy, isChartAvailable, chartContainerHeight, containerWidth } = chart;
    const { setCrosshairState } = crosshair;
    const { settingsDialog: studiesSettingsDialog, restoreStudies, activeItems } = studies;
    const { settingsDialog: drawToolsSettingsDialog } = drawTools;
    const { settingsDialog: chartTypeSettingsDialog, isCandle, isSpline } = chartType;
    const { updateProps, isChartClosed } = state;
    const { theme, position, isHighestLowestMarkerEnabled } = chartSetting;
    const { isActive: isLoading, show: showChart } = loader;

    const rootRef = React.useRef<HTMLDivElement>(null);
    const chartContainerRef = React.useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => {
        return {
            hasPredictionIndicators() {
                return localStorage.getItem('predictionIndicators') !== null;
            },
            triggerPopup(cancelCallback: () => void) {
                timeperiod.predictionIndicator.dialogPortalNodeId = 'modal_root';
                timeperiod.predictionIndicator.setOpen(true);
                timeperiod.predictionIndicator.setCancel(() => {
                    if (localStorage.getItem('predictionIndicators')) {
                        cancelCallback();
                        restoreStudies([
                            ...activeItems,
                            ...safeParse(localStorage.getItem('predictionIndicators') || ''),
                        ]);
                    }
                });
            },
        };
    });

    React.useEffect(() => {
        initGA();
        logPageView();
        updateProps(props);
        init(rootRef.current, props);

        return () => {
            destroy();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    React.useEffect(() => {
        updateProps(props);
    }, [props, updateProps]);

    const prevLang = usePrevious(t.lang);
    React.useEffect(() => {
        if (prevLang && prevLang !== t.lang && !isLoading) {
            showChart?.();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [t.lang]);

    // Memoize defaultTopWidgets to prevent recreation on every render
    const defaultTopWidgets = React.useCallback(() => <ChartTitle />, []);

    const {
        id,
        isMobile = false,
        barriers = [],
        children,
        chartControlsWidgets,
        topWidgets,
        bottomWidgets,
        enabledChartFooter = true,
        enabledNavigationWidget = true,
        toolbarWidget = () => null,
        onCrosshairChange = () => null,
        historical,
        contracts_array = [],
    } = props;

    // Create stable references that persist across renders for barriers
    const stableBarrierRef = React.useRef<typeof barriers>([]);
    const lastBarrierHashRef = React.useRef<string>('');

    // Use useEffect to update barriers when they actually change, avoiding useMemo dependency issues
    React.useEffect(() => {
        // Create a hash of all barrier properties that matter for rendering
        const barrierHash = barriers
            .map(barrier => {
                if (!barrier) return 'null';

                const {
                    high,
                    low,
                    color,
                    lineStyle,
                    shade,
                    shadeColor,
                    relative,
                    draggable,
                    hidePriceLines,
                    hideBarrierLine,
                    hideOffscreenLine,
                    title,
                    key,
                } = barrier;
                return JSON.stringify({
                    high,
                    low,
                    color,
                    lineStyle,
                    shade,
                    shadeColor,
                    relative,
                    draggable,
                    hidePriceLines,
                    hideBarrierLine,
                    hideOffscreenLine,
                    title,
                    key,
                });
            })
            .join('|');

        // Only update the stable reference if the barrier properties have actually changed
        if (barrierHash !== lastBarrierHashRef.current) {
            // Barrier data actually changed, updating stable reference
            lastBarrierHashRef.current = barrierHash;
            stableBarrierRef.current = barriers.map(barrier => {
                if (!barrier) return barrier;

                // Create a plain object with barrier properties for the chart
                return {
                    ...barrier,
                    high: barrier.high,
                    low: barrier.low,
                    color: barrier.color,
                    lineStyle: barrier.lineStyle,
                    shade: barrier.shade,
                    shadeColor: barrier.shadeColor,
                    relative: barrier.relative,
                    draggable: barrier.draggable,
                    hidePriceLines: barrier.hidePriceLines,
                    hideBarrierLine: barrier.hideBarrierLine,
                    hideOffscreenLine: barrier.hideOffscreenLine,
                    title: barrier.title,
                    key: barrier.key,
                };
            });
        }
    }, [barriers]);

    // Return the stable reference directly without useMemo
    const stableBarriers = stableBarrierRef.current;

    // Memoize the entire barriers rendering to prevent re-renders when barriers haven't changed
    const memoizedBarriers = React.useMemo(() => {
        return stableBarriers.map(({ key, ...barr }, idx) => (
            <Barrier
                key={key || `barrier-${idx}`} // eslint-disable-line react/no-array-index-key
                high={barr.high}
                low={barr.low}
                color={barr.color}
                lineStyle={barr.lineStyle}
                shade={barr.shade}
                shadeColor={barr.shadeColor}
                relative={barr.relative}
                draggable={barr.draggable}
                hidePriceLines={barr.hidePriceLines}
                hideBarrierLine={barr.hideBarrierLine}
                hideOffscreenLine={barr.hideOffscreenLine}
                title={barr.title}
                onChange={barr.onChange}
                hideOffscreenBarrier={barr.hideOffscreenBarrier}
                isSingleBarrier={barr.isSingleBarrier}
                opacityOnOverlap={barr.opacityOnOverlap}
                showOffscreenArrows={barr.showOffscreenArrows}
                foregroundColor={barr.foregroundColor}
            />
        ));
    }, [stableBarriers]);

    const hasPosition = chartControlsWidgets && position && !isMobile;
    const TopWidgets = topWidgets || defaultTopWidgets;
    // if there are any markers, then increase the subholder z-index
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const ToolbarWidget = React.useCallback(toolbarWidget, [t.lang]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const memoizedOnCrosshairChange = React.useCallback(onCrosshairChange, [t.lang]);

    React.useEffect(() => {
        chartAdapter.onMount(chartContainerRef.current as HTMLDivElement);
        return () => {
            chartAdapter.onUnmount();
        };
    }, []);

    React.useEffect(() => {
        chartAdapter.updateContracts(contracts_array);
    }, [contracts_array]);

    // Move conditional logic to useEffect to prevent re-renders during render phase
    React.useEffect(() => {
        // to always show price info on mobile screen
        if (isMobile && crosshair.state !== 2) {
            setCrosshairState(2);
        }
    }, [isMobile, crosshair.state, setCrosshairState]);

    // Memoize the dynamic style object to prevent recreation on every render
    const chartContainerStyle = React.useMemo(
        () => ({
            height: historical && chartContainerHeight && isMobile ? chartContainerHeight - 30 : chartContainerHeight,
        }),
        [historical, chartContainerHeight, isMobile]
    );

    return (
        <div
            id={id || chartId}
            className={classNames('smartcharts', `smartcharts-${theme}`, {
                'smartcharts--navigation-widget': enabledNavigationWidget,
                'smartcharts--loading': isLoading,
                'smartcharts--has-markers': children && (children as NodeList).length,
                [`smartcharts-${containerWidth}`]: !isMobile,
            })}
        >
            <div
                className={classNames({
                    'smartcharts-mobile': isMobile,
                    'smartcharts-desktop': !isMobile,
                })}
            >
                <div className='cq-context' ref={rootRef}>
                    <div
                        className={classNames({
                            [`cq-chart-control-${position}`]: hasPosition,
                            'cq-chart-control-bottom': !hasPosition,
                        })}
                    >
                        <div className='ciq-chart-area'>
                            <div className={classNames('ciq-chart', { 'closed-chart': isChartClosed })}>
                                <RenderInsideChart at='subholder'>{memoizedBarriers}</RenderInsideChart>
                                <RenderInsideChart at='subholder'>
                                    {!isCandle && !isSpline && isHighestLowestMarkerEnabled && <HighestLowestMarker />}
                                </RenderInsideChart>
                                <RenderInsideChart at='subholder'>{children}</RenderInsideChart>
                                <RenderInsideChart at='subholder'>
                                    <PaginationLoader />
                                </RenderInsideChart>
                                {!loader.isActive && (
                                    <div className='cq-top-ui-widgets'>
                                        <TopWidgets />
                                    </div>
                                )}
                                <div className='chartContainer' ref={chartContainerRef} style={chartContainerStyle}>
                                    <Crosshair />
                                </div>
                                {enabledNavigationWidget && (
                                    <NavigationWidget onCrosshairChange={memoizedOnCrosshairChange} />
                                )}
                                {ToolbarWidget && <ToolbarWidget />}
                                {!isChartAvailable && (
                                    <div className='cq-chart-unavailable'>
                                        {t.translate('Chart data is not available for this symbol.')}
                                    </div>
                                )}
                                <div className='cq-inchart-subholder' />
                                <BottomWidgetsContainer>
                                    <BottomWidget bottomWidgets={bottomWidgets} />
                                </BottomWidgetsContainer>
                            </div>
                            {chartControlsWidgets !== null && !enabledChartFooter && (
                                <ChartControls widgets={chartControlsWidgets} />
                            )}
                            <ScrollToRecent />
                            {enabledChartFooter && <ChartFooter />}
                            <Loader />
                        </div>
                    </div>
                </div>
                <SettingsDialog store={drawToolsSettingsDialog} />
                <SettingsDialog store={chartTypeSettingsDialog} />
                <SettingsDialog store={studiesSettingsDialog} />
                <IndicatorPredictionDialog />
                <div id='smartcharts_modal' className='ciq-modal' />
            </div>
        </div>
    );
});

export default observer(Chart);
