'use client';

import { useAuthStore } from '@/stores/auth-store';
import { useUserStore } from '@/stores/user-store';

const translations = {
  en: {
    dashboard: 'Dashboard',
    parks: 'Parks',
    staffs: 'Staffs',
    events: 'Events',
    settings: 'Settings',
    logout: 'Logout',
    admin: 'Administrator',
    manager: 'Manager',
    user: 'User',
    access_denied: 'Access Denied',
    no_permission_view: 'You do not have permission to view this page.',
    view: 'View',
    edit: 'Edit',
    delete: 'Delete',
    add: 'Add',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    status: 'Status',
    online: 'Online',
    offline: 'Offline',
    active: 'Active',
    inactive: 'Inactive',
    search: 'Search',
    filter: 'Filter',
    export_csv: 'Export CSV',
    acknowledgement: 'Acknowledgement',
    ack: 'Ack',
    id: 'ID',
    code: 'Code',
    type: 'Type',
    park: 'Park',
    received: 'Received',
    actions: 'Actions',
    go_to_page: 'Go to page',
    items_per_page: 'Items per page',
    of: 'of',
    results: 'results',
    theme: 'Theme',
    language: 'Language',
    notifications: 'Notifications',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    english: 'English',
    vietnamese: 'Vietnamese',
  },
  vi: {
    dashboard: 'Bảng điều khiển',
    parks: 'Bãi xe',
    staffs: 'Nhân viên',
    events: 'Sự kiện',
    settings: 'Cài đặt',
    logout: 'Đăng xuất',
    admin: 'Quản trị viên',
    manager: 'Quản lý',
    user: 'Người dùng',
    access_denied: 'Truy cập bị từ chối',
    no_permission_view: 'Bạn không có quyền xem trang này.',
    view: 'Xem',
    edit: 'Sửa',
    delete: 'Xóa',
    add: 'Thêm',
    save: 'Lưu',
    cancel: 'Hủy',
    confirm: 'Xác nhận',
    status: 'Trạng thái',
    online: 'Trực tuyến',
    offline: 'Ngoại tuyến',
    active: 'Hoạt động',
    inactive: 'Không hoạt động',
    search: 'Tìm kiếm',
    filter: 'Lọc',
    export_csv: 'Xuất CSV',
    acknowledgement: 'Xác nhận',
    ack: 'XN',
    id: 'ID',
    code: 'Mã',
    type: 'Loại',
    park: 'Bãi xe',
    received: 'Đã nhận',
    actions: 'Thao tác',
    go_to_page: 'Đi đến trang',
    items_per_page: 'Số dòng mỗi trang',
    of: 'của',
    results: 'kết quả',
    theme: 'Giao diện',
    language: 'Ngôn ngữ',
    notifications: 'Thông báo',
    light: 'Sáng',
    dark: 'Tối',
    system: 'Hệ thống',
    english: 'Tiếng Anh',
    vietnamese: 'Tiếng Việt',
  },
};

export function useTranslation() {
  const session = useAuthStore((state) => state.session);
  const users = useUserStore((state) => state.users);
  
  const currentUser = session.user 
    ? users.find((u) => u.id === session.user?.id) ?? session.user 
    : null;

  const language = currentUser?.language || 'English';
  const langCode = language === 'Vietnamese' ? 'vi' : 'en';

  const t = (key: keyof typeof translations.en) => {
    return translations[langCode][key] || translations.en[key] || key;
  };

  return { t, langCode };
}
