var util = require('../../../utils/util.js');
var api = require('../../../config/api.js');
const pay = require('../../../services/pay.js');

Page({
  data:{
    orderList: []
  },
  onLoad:function(options){
    // 页面初始化 options为页面跳转所带来的参数

    this.getOrderList();
  },
  getOrderList(){
    let that = this;
    util.request(api.OrderList).then(function (res) {
      if (res.errno === 0) {
        console.log(res.data);
        that.setData({
          orderList: res.data.data
        });
      }
    });
  },
  payOrder(e){
    const i = e.target.dataset.orderIndex
    const orderId = parseInt(this.data.orderList[i].id)
    pay.payOrder(orderId).then(res => {
      util.post(api.updateOrderInfo, {orderId: orderId}).then(res => {
        wx.showToast({
          title: '支付成功',
        })
        this.getOrderList()
      })
    }).catch(res => {
      util.showErrorToast('支付失败');
    });
  },
  onReady:function(){
    // 页面渲染完成
  },
  onShow:function(){
    // 页面显示
  },
  onHide:function(){
    // 页面隐藏
  },
  onUnload:function(){
    // 页面关闭
  }
})