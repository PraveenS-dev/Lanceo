import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getMonthWiseProjects, getBittingsStats, getContractsStats, getTicketsStats, getTransactionStats } from '../services/Dashboard';
import { AnimatePresence, motion } from 'framer-motion';
import BrudCrumbs from '../components/BrudCrumbs';
import FilterBtn from '../components/Buttons/Filter_btn';
import Chart from 'react-apexcharts';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import '../styles/flatpickr-custom.css';
import monthSelectPlugin from 'flatpickr/dist/plugins/monthSelect';
import 'flatpickr/dist/plugins/monthSelect/style.css';
import yearSelectPlugin from '../utils/yearSelectPlugin';
import { LucideRotateCcw, Search } from 'lucide-react';

interface MonthWiseData {
  success: boolean;
  year: string | number;
  monthlyCounts: number[];
  total: number;
}

interface BittingsStatsData {
  success: boolean;
  stats: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    breakdown: Array<{
      status: number;
      statusName: string;
      count: number;
    }>;
  };
}

interface ContractsStatsData {
  success: boolean;
  stats: {
    total: number;
    paymentPending: number;
    working: number;
    ticketRaised: number;
    ticketClosed: number;
    submitted: number;
    completed: number;
    reworkNeeded: number;
    breakdown: Array<{
      status: number;
      statusName: string;
      count: number;
      color: string;
    }>;
  };
}

interface TicketsStatsData {
  success: boolean;
  stats: {
    total: number;
    refundPending: number;
    closed: number;
    cancelled: number;
    breakdown: Array<{
      status: number;
      statusName: string;
      count: number;
      color: string;
    }>;
  };
}

interface TransactionStatsData {
  success: boolean;
  stats: {
    sentAmount: number;
    receivedAmount: number;
    totalAmount: number;
    remainingPurse: number;
    monthlyReceived: number[];
    monthlySent: number[];
  };
}

const Dashboard = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [dashboardData, setDashboardData] = useState<MonthWiseData | null>(null);
  const [bittingsData, setBittingsData] = useState<BittingsStatsData | null>(null);
  const [contractsData, setContractsData] = useState<ContractsStatsData | null>(null);
  const [ticketsData, setTicketsData] = useState<TicketsStatsData | null>(null);
  const [transactionData, setTransactionData] = useState<TransactionStatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [showFilter, setShowFilter] = useState(false);

  const crumbs = [
    { label: "Home", path: "/dashboard" },
    { label: "Dashboard" },
  ];

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  useEffect(() => {
    fetchDashboardData();
  }, [selectedYear]);

  useEffect(() => {
    fetchTransactionStats(selectedYear);
  }, [selectedYear, user?.id, user?.role]);

  useEffect(() => {
    fetchBittingsStats(selectedYear, selectedMonth);
    fetchContractsStats(selectedYear, selectedMonth);
    fetchTicketsStats(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth, user?.id, user?.role]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const role = user?.role?.toString();
      const userId = user?.id;
      const data = await getMonthWiseProjects(selectedYear, userId, role);
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBittingsStats = async (yearParam?: string, monthParam?: string) => {
    try {
      const role = user?.role?.toString();
      const userId = user?.id;
      const data = await getBittingsStats(
        userId,
        role,
        yearParam ?? selectedYear,
        monthParam ?? selectedMonth
      );
      setBittingsData(data);
    } catch (error) {
      console.error('Failed to fetch bittings stats:', error);
    }
  };

  const fetchContractsStats = async (yearParam?: string, monthParam?: string) => {
    try {
      const role = user?.role?.toString();
      const userId = user?.id;
      const data = await getContractsStats(
        userId,
        role,
        yearParam ?? selectedYear,
        monthParam ?? selectedMonth
      );
      setContractsData(data);
    } catch (error) {
      console.error('Failed to fetch contracts stats:', error);
    }
  };

  const fetchTicketsStats = async (yearParam?: string, monthParam?: string) => {
    try {
      const role = user?.role?.toString();
      const userId = user?.id;
      const data = await getTicketsStats(
        userId,
        role,
        yearParam ?? selectedYear,
        monthParam ?? selectedMonth
      );
      setTicketsData(data);
    } catch (error) {
      console.error('Failed to fetch tickets stats:', error);
    }
  };

  const fetchTransactionStats = async (yearParam?: string) => {
    try {
      const role = user?.role?.toString();
      const userId = user?.id;
      const data = await getTransactionStats(
        yearParam ?? selectedYear,
        undefined,
        userId,
        role
      );
      setTransactionData(data);
    } catch (error) {
      console.error('Failed to fetch transaction stats:', error);
    }
  };

  const chartOptions: any = {
    chart: {
      type: 'bar',
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
      },
      background: 'transparent',
    },
    colors: ['#3b82f6'],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 4,
        dataLabels: {
          position: 'top',
        },
      },
    },
    dataLabels: {
      enabled: true,
      offsetY: -20,
      style: {
        fontSize: '12px',
        colors: ['#3b82f6'],
      },
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    xaxis: {
      categories: months,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          colors: theme === 'dark' ? '#d1d5db' : '#6b7280',
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      title: {
        text: 'Number of Projects',
        style: {
          color: theme === 'dark' ? '#d1d5db' : '#6b7280',
          fontSize: '14px',
        },
      },
      labels: {
        style: {
          colors: theme === 'dark' ? '#d1d5db' : '#6b7280',
        },
      },
    },
    fill: {
      opacity: 1,
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.4,
        opacityFrom: 0.9,
        opacityTo: 0.7,
      },
    },
    tooltip: {
      y: {
        formatter: function (val: number) {
          return val + ' projects';
        },
      },
      theme: theme === 'dark' ? 'dark' : 'light',
      style: {
        fontSize: '12px',
      },
    },
    grid: {
      borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
  };

  const pieChartOptions: any = {
    chart: {
      type: 'pie',
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: true,
        },
      },
      background: 'transparent',
    },
    colors: ['#fbbf24', '#34d399', '#ef4444'],
    labels: ['Pending', 'Accepted', 'Rejected'],
    legend: {
      position: 'bottom',
      labels: {
        colors: theme === 'dark' ? '#d1d5db' : '#6b7280',
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              color: theme === 'dark' ? '#d1d5db' : '#6b7280',
            },
            value: {
              show: true,
              fontSize: '18px',
              color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
              fontWeight: 600,
            },
            total: {
              show: true,
              label: 'Total Bittings',
              fontSize: '12px',
              color: theme === 'dark' ? '#9ca3af' : '#6b7280',
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return val.toFixed(1) + '%';
      },
      style: {
        fontSize: '12px',
        colors: ['#fff'],
      },
    },
    tooltip: {
      y: {
        formatter: function (val: number) {
          return val + ' bittings';
        },
      },
      theme: theme === 'dark' ? 'dark' : 'light',
      style: {
        fontSize: '12px',
      },
    },
  };

  const contractsChartOptions: any = {
    chart: {
      type: 'pie',
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: true,
        },
      },
      background: 'transparent',
    },
    colors: ['#fbbf24', '#3b82f6', '#f97316', '#10b981', '#a78bfa', '#34d399', '#ef4444'],
    labels: ['Payment Pending', 'Working', 'Ticket Raised', 'Ticket Closed', 'Submitted', 'Completed', 'Re-work Needed'],
    legend: {
      position: 'bottom',
      labels: {
        colors: theme === 'dark' ? '#d1d5db' : '#6b7280',
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              color: theme === 'dark' ? '#d1d5db' : '#6b7280',
            },
            value: {
              show: true,
              fontSize: '18px',
              color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
              fontWeight: 600,
            },
            total: {
              show: true,
              label: 'Total Contracts',
              fontSize: '12px',
              color: theme === 'dark' ? '#9ca3af' : '#6b7280',
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return val.toFixed(1) + '%';
      },
      style: {
        fontSize: '12px',
        colors: ['#fff'],
      },
    },
    tooltip: {
      y: {
        formatter: function (val: number) {
          return val + ' contracts';
        },
      },
      theme: theme === 'dark' ? 'dark' : 'light',
      style: {
        fontSize: '12px',
      },
    },
  };

  const ticketChartOptions: any = {
    chart: {
      type: 'pie',
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: true,
        },
      },
      background: 'transparent',
    },
    colors: ['#facc15', '#34d399', '#ef4444'],
    labels: ['Refund Pending', 'Closed', 'Cancelled'],
    legend: {
      position: 'bottom',
      labels: {
        colors: theme === 'dark' ? '#d1d5db' : '#6b7280',
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              color: theme === 'dark' ? '#d1d5db' : '#6b7280',
            },
            value: {
              show: true,
              fontSize: '18px',
              color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
              fontWeight: 600,
            },
            total: {
              show: true,
              label: 'Total Tickets',
              fontSize: '12px',
              color: theme === 'dark' ? '#9ca3af' : '#6b7280',
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return val.toFixed(1) + '%';
      },
      style: {
        fontSize: '12px',
        colors: ['#fff'],
      },
    },
    tooltip: {
      y: {
        formatter: function (val: number) {
          return val + ' tickets';
        },
      },
      theme: theme === 'dark' ? 'dark' : 'light',
      style: {
        fontSize: '12px',
      },
    },
  };

  const transactionChartOptions: any = {
    chart: {
      type: 'line',
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
      },
      background: 'transparent',
      zoom: {
        enabled: true,
      },
    },
    colors: ['#10b981', '#ef4444'],
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    xaxis: {
      categories: months,
      labels: {
        style: {
          colors: theme === 'dark' ? '#9ca3af' : '#6b7280',
          fontSize: '12px',
        },
      },
      axisBorder: {
        color: theme === 'dark' ? '#374151' : '#e5e7eb',
      },
      axisTicks: {
        color: theme === 'dark' ? '#374151' : '#e5e7eb',
      },
    },
    yaxis: {
      title: {
        text: 'Amount',
        style: {
          color: theme === 'dark' ? '#d1d5db' : '#6b7280',
        },
      },
      labels: {
        style: {
          colors: theme === 'dark' ? '#9ca3af' : '#6b7280',
          fontSize: '12px',
        },
        formatter: function (val: number) {
          return '₹' + val.toFixed(0);
        },
      },
      axisBorder: {
        color: theme === 'dark' ? '#374151' : '#e5e7eb',
      },
      axisTicks: {
        color: theme === 'dark' ? '#374151' : '#e5e7eb',
      },
    },
    legend: {
      position: 'top',
      labels: {
        colors: theme === 'dark' ? '#d1d5db' : '#6b7280',
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      theme: theme === 'dark' ? 'dark' : 'light',
      x: {
        show: true,
      },
      y: {
        formatter: function (val: number) {
          return '₹' + val.toFixed(2);
        },
      },
    },
    grid: {
      borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
      strokeDashArray: 4,
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
  };

  const transactionChartSeries = [
    {
      name: 'Amount Received',
      data: transactionData?.stats?.monthlyReceived || Array(12).fill(0),
    },
    {
      name: 'Amount Sent',
      data: transactionData?.stats?.monthlySent || Array(12).fill(0),
    },
  ];

  const chartSeries = [
    {
      name: 'Projects',
      data: dashboardData?.monthlyCounts || Array(12).fill(0),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="p-6 max-w-7xl mx-auto">
        <BrudCrumbs crumbs={crumbs} />
        <div className='flex justify-between mt-3 p-3 bg-red-300 dark:bg-red-600/30 rounded-sm'>
          <h3 className='text-2xl font-bold'>Dashboard</h3>
          <div className='px-3 flex'>
            <FilterBtn showFilter={showFilter} setShowFilter={setShowFilter} />
          </div>
        </div>
        <AnimatePresence>
          {showFilter && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className='mt-3 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md'
            >
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-3'>
                {/* Year Picker */}
                <div>
                  <label className='block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'>
                    Year
                  </label>
                  <Flatpickr
                    value={new Date(parseInt(selectedYear), 0, 1)}
                    onChange={(dates: Date[]) => {
                      if (dates[0]) {
                        setSelectedYear(dates[0].getFullYear().toString());
                      }
                    }}
                    options={{
                      mode: 'single',
                      plugins: [(yearSelectPlugin as any)({
                        theme: theme === 'dark' ? 'dark' : 'light',
                      })],
                      dateFormat: 'Y',
                      altInput: true,
                      altFormat: 'Y',
                      minDate: new Date(2020, 0, 1),
                      maxDate: new Date(),
                    } as any}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                  />
                </div>

                {/* Month Picker */}
                <div>
                  <label className='block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'>
                    Month
                  </label>
                  <Flatpickr
                    value={new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, 1)}
                    onChange={(dates: Date[]) => {
                      if (dates[0]) {
                        setSelectedMonth((dates[0].getMonth() + 1).toString().padStart(2, '0'));
                      }
                    }}
                    options={{
                      mode: 'single',
                      altInput: true,
                      altFormat: 'F',
                      dateFormat: 'm',
                      plugins: [(monthSelectPlugin as any)({
                        shorthand: true,
                        dateFormat: 'm',
                        altFormat: 'F',
                        theme: theme === 'dark' ? 'dark' : 'light',
                      })],
                      minDate: new Date(2020, 0, 1),
                      maxDate: new Date(),
                    } as any}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                  />
                </div>


              </div>

              <div className='flex justify-end mt-5'>

                {/* Search Button */}
                <button
                  onClick={() => {
                    fetchDashboardData();
                    fetchBittingsStats(selectedYear, selectedMonth);
                    fetchContractsStats(selectedYear, selectedMonth);
                    fetchTicketsStats(selectedYear, selectedMonth);
                    fetchTransactionStats(selectedYear);
                  }}
                  className="me-3 flex items-center gap-2 bg-blue-600 dark:bg-blue-800 font-medium transition-all duration-200 hover:bg-blue-700 dark:hover:bg-blue-300 active:scale-95 rounded-md text-white dark:text-gray-200 py-2 px-4 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  Search
                </button>

                {/* Reset Button */}
                <button
                  onClick={() => {
                    const defaultYear = new Date().getFullYear().toString();
                    const defaultMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
                    setSelectedYear(defaultYear);
                    setSelectedMonth(defaultMonth);
                    fetchDashboardData();
                    fetchBittingsStats(defaultYear, defaultMonth);
                    fetchContractsStats(defaultYear, defaultMonth);
                    fetchTicketsStats(defaultYear, defaultMonth);
                    fetchTransactionStats(defaultYear);
                  }}
                  className="flex items-center gap-2  bg-red-600 dark:bg-red-800 font-medium transition-all duration-200  hover:bg-red-700 dark:hover:bg-red-300 active:scale-95 rounded-md  text-white dark:text-gray-200 py-2 px-4 me-2 cursor-pointer"
                >
                  <LucideRotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-8"
        >
          {/* <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Welcome back, {user?.name}!
          </h1> */}

          {/* Month-wise Projects Bar Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8"
          >
            <div className='mb-6'>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Monthly Project Count - {selectedYear}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Total Projects: <span className='font-semibold text-blue-600 dark:text-blue-400'>{dashboardData?.total || 0}</span>
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : dashboardData?.monthlyCounts ? (
              <div>
                <Chart
                  options={chartOptions}
                  series={chartSeries}
                  type="bar"
                  height={400}
                />

                {/* Statistics */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Projects</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                      {dashboardData?.total || 0}
                    </p>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Average/Month</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                      {dashboardData?.total ? (dashboardData.total / 12).toFixed(1) : 0}
                    </p>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Peak Month</p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                      {dashboardData?.monthlyCounts ? months[dashboardData.monthlyCounts.indexOf(Math.max(...dashboardData.monthlyCounts))] : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No data available</p>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Bittings Stats Pie Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8"
        >
          <div className='mb-6'>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Bittings Statistics
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Total Bittings: <span className='font-semibold text-blue-600 dark:text-blue-400'>{bittingsData?.stats?.total || 0}</span>
            </p>
          </div>

          {bittingsData?.stats && bittingsData.stats.total > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pie Chart */}
              <div>
                <Chart
                  options={pieChartOptions}
                  series={[bittingsData.stats.pending, bittingsData.stats.accepted, bittingsData.stats.rejected]}
                  type="donut"
                  height={400}
                />
              </div>

              {/* Statistics Cards */}
              <div className="flex flex-col justify-center gap-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/30 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Pending</p>
                  <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">
                    {bittingsData.stats.pending}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {((bittingsData.stats.pending / bittingsData.stats.total) * 100).toFixed(1)}% of total
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/30 p-6 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Accepted</p>
                  <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                    {bittingsData.stats.accepted}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {((bittingsData.stats.accepted / bittingsData.stats.total) * 100).toFixed(1)}% of total
                  </p>
                </div>

                <div className="bg-red-50 dark:bg-red-900/30 p-6 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Rejected</p>
                  <p className="text-4xl font-bold text-red-600 dark:text-red-400">
                    {bittingsData.stats.rejected}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {((bittingsData.stats.rejected / bittingsData.stats.total) * 100).toFixed(1)}% of total
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No bittings data available</p>
            </div>
          )}
        </motion.div>

        {/* Tickets Stats Pie Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 my-8"
        >
          <div className='mb-6'>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Ticket Status Overview
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Total Tickets: <span className='font-semibold text-blue-600 dark:text-blue-400'>{ticketsData?.stats?.total || 0}</span>
            </p>
          </div>

          {ticketsData?.stats && ticketsData.stats.total > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <Chart
                  options={ticketChartOptions}
                  series={[
                    ticketsData.stats.refundPending,
                    ticketsData.stats.closed,
                    ticketsData.stats.cancelled,
                  ]}
                  type="donut"
                  height={400}
                />
              </div>

              <div className="flex flex-col justify-center gap-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/30 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Refund Pending</p>
                  <p className="text-4xl font-bold text-yellow-500 dark:text-yellow-400">
                    {ticketsData.stats.refundPending}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {((ticketsData.stats.refundPending / ticketsData.stats.total) * 100).toFixed(1)}% of total
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/30 p-6 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Closed</p>
                  <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                    {ticketsData.stats.closed}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {((ticketsData.stats.closed / ticketsData.stats.total) * 100).toFixed(1)}% of total
                  </p>
                </div>

                <div className="bg-red-50 dark:bg-red-900/30 p-6 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Cancelled</p>
                  <p className="text-4xl font-bold text-red-600 dark:text-red-400">
                    {ticketsData.stats.cancelled}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {((ticketsData.stats.cancelled / ticketsData.stats.total) * 100).toFixed(1)}% of total
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No tickets data available</p>
            </div>
          )}
        </motion.div>

        {/* Contracts Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Contracts by Status</h2>
          {contractsData && contractsData.stats.total > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Chart */}
              <div className="lg:col-span-1">
                <Chart
                  options={contractsChartOptions}
                  series={[
                    contractsData.stats.paymentPending,
                    contractsData.stats.working,
                    contractsData.stats.ticketRaised,
                    contractsData.stats.ticketClosed,
                    contractsData.stats.submitted,
                    contractsData.stats.completed,
                    contractsData.stats.reworkNeeded,
                  ]}
                  type="donut"
                  height={400}
                />
              </div>

              {/* Statistics Cards */}
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Payment Pending</p>
                    <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">
                      {contractsData.stats.paymentPending}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {((contractsData.stats.paymentPending / contractsData.stats.total) * 100).toFixed(1)}% of total
                    </p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Working</p>
                    <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                      {contractsData.stats.working}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {((contractsData.stats.working / contractsData.stats.total) * 100).toFixed(1)}% of total
                    </p>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-900/30 p-6 rounded-lg border border-orange-200 dark:border-orange-800">
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Ticket Raised</p>
                    <p className="text-4xl font-bold text-orange-600 dark:text-orange-400">
                      {contractsData.stats.ticketRaised}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {((contractsData.stats.ticketRaised / contractsData.stats.total) * 100).toFixed(1)}% of total
                    </p>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/30 p-6 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Ticket Closed</p>
                    <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                      {contractsData.stats.ticketClosed}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {((contractsData.stats.ticketClosed / contractsData.stats.total) * 100).toFixed(1)}% of total
                    </p>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/30 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Submitted</p>
                    <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                      {contractsData.stats.submitted}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {((contractsData.stats.submitted / contractsData.stats.total) * 100).toFixed(1)}% of total
                    </p>
                  </div>

                  <div className="bg-teal-50 dark:bg-teal-900/30 p-6 rounded-lg border border-teal-200 dark:border-teal-800">
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Completed</p>
                    <p className="text-4xl font-bold text-teal-600 dark:text-teal-400">
                      {contractsData.stats.completed}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {((contractsData.stats.completed / contractsData.stats.total) * 100).toFixed(1)}% of total
                    </p>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/30 p-6 rounded-lg border border-red-200 dark:border-red-800 md:col-span-2">
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Re-work Needed</p>
                    <p className="text-4xl font-bold text-red-600 dark:text-red-400">
                      {contractsData.stats.reworkNeeded}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {((contractsData.stats.reworkNeeded / contractsData.stats.total) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No contracts data available</p>
            </div>
          )}
        </motion.div>

        {/* Transaction Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Transaction Statistics</h2>
          {transactionData && transactionData.stats ? (
            <div>
              {/* Transaction Line Chart */}
              <div className="mb-8 bg-gray-50 dark:bg-gray-700/30 p-6 rounded-lg">
                <Chart
                  options={transactionChartOptions}
                  series={transactionChartSeries}
                  type="line"
                  height={400}
                />
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Sent Amount Card */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-red-50 dark:bg-red-900/30 p-6 rounded-lg border border-red-200 dark:border-red-800"
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Amount Sent</p>
                    <span className="text-2xl">📤</span>
                  </div>
                  <p className="text-4xl font-bold text-red-600 dark:text-red-400">
                    ₹{transactionData.stats.sentAmount.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {transactionData.stats.totalAmount > 0 ? ((transactionData.stats.sentAmount / transactionData.stats.totalAmount) * 100).toFixed(1) : 0}% of total
                  </p>
                </motion.div>

                {/* Received Amount Card */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-green-50 dark:bg-green-900/30 p-6 rounded-lg border border-green-200 dark:border-green-800"
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Amount Received</p>
                    <span className="text-2xl">📥</span>
                  </div>
                  <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                    ₹{transactionData.stats.receivedAmount.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {transactionData.stats.totalAmount > 0 ? ((transactionData.stats.receivedAmount / transactionData.stats.totalAmount) * 100).toFixed(1) : 0}% of total
                  </p>
                </motion.div>

                {/* Total Amount Card */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-lg border border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Transactions</p>
                    <span className="text-2xl">💰</span>
                  </div>
                  <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                    ₹{transactionData.stats.totalAmount.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Combined sent and received
                  </p>
                </motion.div>

                {/* Remaining Purse Card */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={`p-6 rounded-lg border ${transactionData.stats.remainingPurse >= 0
                    ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800'
                    : 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800'
                    }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Remaining Purse</p>
                    <span className="text-2xl">💳</span>
                  </div>
                  <p className={`text-4xl font-bold ${transactionData.stats.remainingPurse >= 0
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-orange-600 dark:text-orange-400'
                    }`}>
                    ₹{transactionData.stats.remainingPurse.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {transactionData.stats.remainingPurse >= 0 ? 'Wallet Balance' : 'Pending Payment'}
                  </p>
                </motion.div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No transaction data available</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;