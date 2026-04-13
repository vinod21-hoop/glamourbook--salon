// src/components/common/StatusBadge.jsx

const statusConfig = {
  pending:     { color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
  confirmed:   { color: 'bg-blue-100 text-blue-700',     label: 'Confirmed' },
  checked_in:  { color: 'bg-indigo-100 text-indigo-700', label: 'Checked In' },
  in_progress: { color: 'bg-purple-100 text-purple-700', label: 'In Progress' },
  completed:   { color: 'bg-green-100 text-green-700',   label: 'Completed' },
  cancelled:   { color: 'bg-red-100 text-red-700',       label: 'Cancelled' },
  no_show:     { color: 'bg-gray-100 text-gray-700',     label: 'No Show' },
  waiting:     { color: 'bg-yellow-100 text-yellow-700', label: 'Waiting' },
  grace_period:{ color: 'bg-orange-100 text-orange-700', label: 'Grace Period' },
  serving:     { color: 'bg-green-100 text-green-700',   label: 'Serving' },
  skipped:     { color: 'bg-red-100 text-red-700',       label: 'Skipped' },
  captured:    { color: 'bg-green-100 text-green-700',   label: 'Paid' },
  failed:      { color: 'bg-red-100 text-red-700',       label: 'Failed' },
  refunded:    { color: 'bg-gray-100 text-gray-700',     label: 'Refunded' },
};

const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || {
    color: 'bg-gray-100 text-gray-600',
    label: status,
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
