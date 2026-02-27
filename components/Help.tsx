
import React from 'react';
import { HelpCircle, BookOpen, Mail, Phone, ExternalLink, Shield, Eye, Zap, Trophy, Users } from 'lucide-react';

const Help: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8 sm:space-y-12">
      {/* Header Section */}
      <div className="bg-slate-950 p-8 sm:p-12 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="relative z-10">
          <div className="bg-lime-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 rotate-3">
            <BookOpen className="w-8 h-8 text-slate-950" />
          </div>
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter italic leading-none">
            Trung tâm <span className="text-lime-400">Trợ giúp</span>
          </h2>
          <p className="text-slate-400 mt-4 font-bold uppercase tracking-widest text-xs sm:text-sm">Hướng dẫn vận hành hệ thống PicklePro Manager</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Guide */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
            <div className="space-y-10">
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><Users className="w-6 h-6" /></div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">1. Phân quyền người dùng</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-2 text-slate-900 font-black uppercase text-xs tracking-widest">
                      <Shield className="w-4 h-4 text-lime-500" /> Quản trị viên (Admin)
                    </div>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed">Toàn quyền thiết lập giải đấu, nhập tỷ số, thay đổi cấu hình và quản lý VĐV.</p>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-2 text-slate-900 font-black uppercase text-xs tracking-widest">
                      <Eye className="w-4 h-4 text-blue-500" /> Người xem (Viewer)
                    </div>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed">Chỉ được xem bảng xếp hạng và tỷ số trực tuyến. Không có quyền thao tác chỉnh sửa.</p>
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-lime-100 p-3 rounded-xl text-lime-700"><Zap className="w-6 h-6" /></div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">2. Lập lịch thi đấu</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex-shrink-0 flex items-center justify-center text-[10px] font-black mt-1">01</div>
                    <div className="text-slate-700 text-sm leading-relaxed">
                      <span className="font-black text-slate-900 uppercase text-[10px] tracking-widest block mb-1">Nhập liệu linh hoạt</span>
                      Hỗ trợ nhập tay, dán từ Clipboard hoặc nhập từ file Excel. Định dạng: <code className="bg-slate-100 px-2 py-0.5 rounded text-rose-500 font-mono font-bold">Tên - Trình độ (A/B)</code>.
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex-shrink-0 flex items-center justify-center text-[10px] font-black mt-1">02</div>
                    <div className="text-slate-700 text-sm leading-relaxed">
                      <span className="font-black text-slate-900 uppercase text-[10px] tracking-widest block mb-1">Tự động ghép cặp & Chia bảng</span>
                      Chế độ <strong>Đánh Đôi</strong> sẽ tự động ghép cặp 1 trình độ A với 1 trình độ B. Hệ thống tự động chia bảng và tạo lịch thi đấu vòng tròn.
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex-shrink-0 flex items-center justify-center text-[10px] font-black mt-1">03</div>
                    <div className="text-slate-700 text-sm leading-relaxed">
                      <span className="font-black text-slate-900 uppercase text-[10px] tracking-widest block mb-1">Cấu hình Knockout</span>
                      Hỗ trợ cấu hình lấy Top 1 hoặc Top 2 mỗi bảng vào vòng Knockout. Tự động tạo sơ đồ thi đấu từ Tứ kết, Bán kết đến Chung kết.
                    </div>
                  </li>
                </ul>
              </section>

              <section>
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-yellow-100 p-3 rounded-xl text-yellow-700"><Trophy className="w-6 h-6" /></div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">3. Quản lý tỷ số & Excel</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex-shrink-0 flex items-center justify-center text-[10px] font-black mt-1">01</div>
                    <div className="text-slate-700 text-sm leading-relaxed">
                      <span className="font-black text-slate-900 uppercase text-[10px] tracking-widest block mb-1">Cập nhật Real-time</span>
                      Tỷ số được đồng bộ tức thời qua WebSocket. Người xem sẽ thấy thay đổi ngay khi Admin nhập điểm mà không cần tải lại trang.
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex-shrink-0 flex items-center justify-center text-[10px] font-black mt-1">02</div>
                    <div className="text-slate-700 text-sm leading-relaxed">
                      <span className="font-black text-slate-900 uppercase text-[10px] tracking-widest block mb-1">Nhập/Xuất Excel thông minh</span>
                      Hệ thống cho phép xuất toàn bộ lịch thi đấu và bảng xếp hạng ra Excel. Bạn có thể nhập điểm vào file Excel rồi tải lên lại để cập nhật hàng loạt.
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex-shrink-0 flex items-center justify-center text-[10px] font-black mt-1">03</div>
                    <div className="text-slate-700 text-sm leading-relaxed">
                      <span className="font-black text-slate-900 uppercase text-[10px] tracking-widest block mb-1">Bảng vàng vinh danh</span>
                      Sau khi kết thúc trận Chung kết, hệ thống sẽ hiển thị Bảng vàng vinh danh hạng 1, 2, 3 với hiệu ứng sinh động.
                    </div>
                  </li>
                </ul>
              </section>
            </div>
          </div>
          
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl border border-white/5">
            <h3 className="text-xl font-black mb-6 flex items-center gap-3 uppercase italic tracking-tight">
              <Shield className="w-6 h-6 text-lime-400" />
              Bản quyền & Phát triển
            </h3>
            <div className="space-y-4 text-slate-400 text-sm leading-relaxed">
              <p>Hệ thống <strong>PicklePro Manager</strong> được phát triển bởi <strong>Lê Minh Đức (VNPT Cao Bằng)</strong>.</p>
              <p>Mọi quyền được bảo lưu. Nghiêm cấm sao chép, phân phối lại mã nguồn hoặc sử dụng cho mục đích thương mại khi chưa có sự đồng ý của tác giả.</p>
              <div className="pt-4 flex items-center gap-4">
                <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-white">Version 2.5.0 Elite</div>
                <div className="px-4 py-2 bg-lime-500/10 rounded-xl border border-lime-500/20 text-[10px] font-black uppercase tracking-widest text-lime-400">Stable Release</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl border border-white/5">
            <h3 className="text-xl font-black mb-6 flex items-center gap-3 uppercase italic tracking-tight text-lime-400">
              <Mail className="w-6 h-6" />
              Liên hệ hỗ trợ
            </h3>
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Tác giả</p>
                <p className="font-bold text-lg text-white">Lê Minh Đức</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Email</p>
                <a href="mailto:duclm.cbg@vnpt.vn" className="font-bold text-white hover:text-lime-400 transition-colors">duclm.cbg@vnpt.vn</a>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Hotline</p>
                <a href="tel:+84919749118" className="font-bold text-white hover:text-lime-400 transition-colors">+84 919 749 118</a>
              </div>
            </div>
            <div className="mt-10 pt-6 border-t border-white/10">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">VNPT Cao Bằng • 2025</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] text-slate-900 shadow-sm border border-slate-200">
            <h3 className="text-xl font-black mb-6 flex items-center gap-3 uppercase italic tracking-tight">
              <HelpCircle className="w-6 h-6 text-blue-600" />
              Tài nguyên
            </h3>
            <div className="space-y-3">
              <a href="#" className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all border border-slate-100 group">
                <span className="font-bold text-sm text-slate-700">Mẫu file Excel</span>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
              </a>
              <a href="#" className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all border border-slate-100 group">
                <span className="font-bold text-sm text-slate-700">Video hướng dẫn</span>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
              </a>
              <a href="#" className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all border border-slate-100 group">
                <span className="font-bold text-sm text-slate-700">Cộng đồng Pickleball</span>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
