import React from 'react';
import PropTypes from 'prop-types';
import Chart from 'react-chartjs-2';
import CircularProgress from '@material-ui/core/CircularProgress';
import { withStyles } from '@material-ui/core/styles';
import { cjsGenerator } from './utils';
import { Data, isEqual } from '../../datas';
import { GMTDate as Date } from '../../dates';
import { ErrorMessage } from '../../errors';
import { selectFrom } from '../../vectors';
import { coalesce } from '../../utils';
import { withTooltip } from './CustomTooltip';

const styles = {
  // This div helps with canvas size changes
  // https://www.chartjs.org/docs/latest/general/responsive.html#important-note
  chartContainer: {
    width: '100%',
    // Do not let it squeeze too much and deform
    minWidth: '400px',
    background: 'white',
  },
  title: {
    width: '100%',
    color: '#56565a',
    fontSize: '1rem',
    backgroundColor: '#d1d2d3',
    padding: '.2rem .3rem .3rem .3rem',
    margin: '0 1rem 0 0',
  },
  errorPanel: {
    margin: '26px auto 40px',
    width: '70%',
  },
};
const ToolTipChart = withTooltip()(Chart);

class ChartJsWrapper extends React.Component {
  constructor(props) {
    super(props);
    const { standardOptions } = props;

    this.state = standardOptions ? cjsGenerator(standardOptions) : {};
  }

  async componentDidUpdate(prevProps) {
    const { standardOptions } = this.props;

    if (isEqual(standardOptions, prevProps.standardOptions)) {
      return;
    }

    // eslint-disable-next-line react/no-did-update-set-state
    this.setState(cjsGenerator(standardOptions));
  }

  render() {
    const {
      classes,
      isLoading,
      title,
      chartHeight,
      missingDataInterval,
    } = this.props;
    const { cjsOptions, standardOptions } = this.state;

    if (isLoading) {
      return (
        <div className={classes.chartContainer}>
          {title && <h2 className={classes.title}>{title}</h2>}

          <div
            style={{
              position: 'relative',
              height: chartHeight,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '50%',
                right: '50%',
              }}
            >
              <CircularProgress />
            </div>
          </div>
        </div>
      );
    }

    if (!standardOptions) {
      return (
        <div className={classes.chartContainer}>
          {title && <h2 className={classes.title}>{title}</h2>}
          <div style={{ height: chartHeight }} />
        </div>
      );
    }

    if (!standardOptions.data.length) {
      return (
        <div className={classes.chartContainer}>
          {title && <h2 className={classes.title}>{title}</h2>}
          <div
            style={{
              position: 'relative',
              height: chartHeight,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '50%',
                right: '50%',
              }}
            >
              No Data
            </div>
          </div>
        </div>
      );
    }

    const currentDate = coalesce(
      Data.get(Data.fromConfig(standardOptions), 'axis.x.max'),
      Date.eod(),
    );
    const allOldData = cjsOptions.data.datasets.every((dataset) => {
      const latestDataDate = Date.newInstance(
        selectFrom(dataset.data)
          .select('x')
          .max(),
      );
      const timeDifference = Math.abs(
        currentDate.getTime() - latestDataDate.getTime(),
      );
      const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));

      return daysDifference > missingDataInterval;
    });

    if (allOldData) {
      const error = new Error(
        `This item has been missing data for at least ${missingDataInterval} days.`,
      );

      return (
        <div className={classes.chartContainer}>
          <ErrorMessage error={error}>
            {title && <h2 className={classes.title}>{title}</h2>}
            <ToolTipChart
              height={chartHeight}
              standardOptions={standardOptions}
              {...cjsOptions}
            />
          </ErrorMessage>
        </div>
      );
    }

    // Log.note(value2json(cjsOptions));

    return (
      <div className={classes.chartContainer}>
        {title && <h2 className={classes.title}>{title}</h2>}
        <ToolTipChart
          height={chartHeight}
          standardOptions={standardOptions}
          {...cjsOptions}
        />
      </div>
    );
  }
}

// The properties are to match ChartJs properties
ChartJsWrapper.propTypes = {
  classes: PropTypes.shape({}).isRequired,
  isLoading: PropTypes.bool,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  chartHeight: PropTypes.number,
  spinnerSize: PropTypes.string,
  standardOptions: PropTypes.shape({
    reverse: PropTypes.bool,
    'axis.y.label': PropTypes.string,
    title: PropTypes.string,
    ticksCallback: PropTypes.func,
    data: PropTypes.arrayOf(PropTypes.shape({})),
  }),
  missingDataInterval: PropTypes.number,
};

ChartJsWrapper.defaultProps = {
  title: '',
  chartHeight: 80,
  spinnerSize: '100%',
  isLoading: false,
  missingDataInterval: 10,
};

export default withStyles(styles)(ChartJsWrapper);
