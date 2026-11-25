import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, color = 'bg-[#4ADE80]', subtitle }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
    >
        <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-wider truncate flex-1" title={title}>
                {title}
            </p>
            {Icon && (
                <div className={`w-8 h-8 rounded-xl ${color} flex items-center justify-center shrink-0 shadow-sm`}>
                    <Icon className="w-4 h-4 text-white" />
                </div>
            )}
        </div>
        <div className="min-w-0">
            <p className="text-lg sm:text-xl lg:text-xl xl:text-2xl font-black text-gray-900 tracking-tight truncate" title={String(value)}>
                {value}
            </p>
            {subtitle && (
                <p className="text-[10px] text-gray-400 mt-1 truncate font-medium" title={subtitle}>
                    {subtitle}
                </p>
            )}
        </div>
    </motion.div>
);

export default StatCard;
