var util = require('../../../utils/util.js');
var api = require('../../../config/api.js');
const pay = require('../../../services/pay.js');
// 引入SDK核心类
var QQMapWX = require('../../../utils/qqmap-wx-jssdk.min.js');
// 实例化API核心类
var qqmapsdk = new QQMapWX({
  key: 'WWVBZ-V4W6P-OVRD2-VYQFN-FHKOO-SWFP3' // 必填
});

var app = getApp();

Page({
  data: {
    checkedGoodsList: [],
    checkedAddress: {},
    checkedCoupon: [],
    couponList: [],
    goodsTotalPrice: 0.00, //商品总价
    freightPrice: 0.00,    //快递费
    couponPrice: 0.00,     //优惠券的价格
    orderTotalPrice: 0.00,  //订单总价
    actualPrice: 0.00,     //实际需要支付的总价
    // addressId: 0,
    couponId: 0,
    postscript: ''
  },
  onLoad: function (options) {

    // 页面初始化 options为页面跳转所带来的参数

    // try {
    //   var addressId = wx.getStorageSync('addressId');
    //   if (addressId) {
    //     this.setData({
    //       'addressId': addressId
    //     });
    //   }

    //   var couponId = wx.getStorageSync('couponId');
    //   if (couponId) {
    //     this.setData({
    //       'couponId': couponId
    //     });
    //   }
    // } catch (e) {
    //   // Do something when catch error
    // }


  },
  handleTextArea(event) {
    this.setData({
      postscript: event.detail.value
    })
  },
  onPickerChange(e) {
    console.log("onPickerChange", e)
  },
  getCheckoutInfo: function () {
    let that = this;
    util.request(api.CartCheckout, { couponId: that.data.couponId }).then(function (res) {
      if (res.errno === 0) {
        console.log(res.data);
        that.setData({
          checkedGoodsList: res.data.checkedGoodsList,
          checkedAddress: res.data.checkedAddress,
          actualPrice: res.data.actualPrice,
          checkedCoupon: res.data.checkedCoupon,
          couponList: res.data.couponList,
          couponPrice: res.data.couponPrice,
          // freightPrice: res.data.freightPrice,
          goodsTotalPrice: res.data.goodsTotalPrice,
        });
      }
      wx.hideLoading();

      if(!res.data.checkedAddress.full_region) return;

      that.handleAddressReverse(res.data.checkedAddress.full_region+res.data.checkedAddress.address)
      console.log(res.data.checkedAddress)
    });
  },
  handleAddressReverse(address) {
    var _this = this;
    //调用地址解析接口
    qqmapsdk.geocoder({
      //获取表单传入地址
      address: address, //地址参数，例：固定地址，address: '北京市海淀区彩和坊路海淀西大街74号'
      success: function(res) {//成功后的回调
        console.log(res);
        var res = res.result;
        var latitude = res.location.lat;
        var longitude = res.location.lng;
        _this.getDistance(latitude, longitude)
      },
      fail: function(error) {
        console.error(error);
      },
      complete: function(res) {
        console.log(res);
      }
    })
  },
  getDistance: function(lat1, lng1, lat2='31.289606', lng2='120.943039') {
    var _this = this;
    //调用距离计算接口
    qqmapsdk.direction({
      mode: 'bicycling',//可选值：'driving'（驾车）、'walking'（步行）、'bicycling'（骑行），不填默认：'driving',可不填
      //from参数不填默认当前地址
      from: {
        latitude: lat1,
        longitude: lng1
      },
      to: {
        latitude: lat2,
        longitude: lng2
      },
      success: function (res) {
        const distance = (res.result.routes[0].distance/1000).toFixed(1);
        const expressPrice = distance > 3 ? (10+(Math.ceil(distance)-3)*5) : 0;
        const actualPrice = (expressPrice + _this.data.goodsTotalPrice).toFixed(2);
        _this.setData({
          actualPrice,
          freightPrice: expressPrice,
        })
        console.log(distance)
      },
      fail: function (error) {
        console.error(error);
      },
      complete: function (res) {
        console.log(res);
      }
    });
  },
  selectAddress() {
    wx.navigateTo({
      url: '/pages/shopping/address/address',
    })
  },
  addAddress() {
    wx.navigateTo({
      url: '/pages/shopping/addressAdd/addressAdd',
    })
  },
  onReady: function () {
    // 页面渲染完成

  },
  onShow: function () {
    // 页面显示
    wx.showLoading({
      title: '加载中...',
    })
    this.getCheckoutInfo();

  },
  onHide: function () {
    // 页面隐藏

  },
  onUnload: function () {
    // 页面关闭

  },
  submitOrder: function () {
    if (this.data.addressId <= 0) {
      util.showErrorToast('请选择收货地址');
      return false;
    }
    util.request(api.OrderSubmit, { addressId: this.data.checkedAddress.id, couponId: this.data.couponId,freightPrice: this.data.freightPrice, postscript: this.data.postscript}, 'POST').then(res => {
      if (res.errno === 0) {
        const orderId = res.data.orderInfo.id;
        pay.payOrder(parseInt(orderId)).then(res => {
          util.post(api.updateOrderInfo, {orderId: orderId}).then(res => {
            wx.redirectTo({
              url: '/pages/payResult/payResult?status=1&orderId=' + orderId
            });
          })
        }).catch(res => {
          wx.redirectTo({
            url: '/pages/payResult/payResult?status=0&orderId=' + orderId
          });
        });
      } else {
        util.showErrorToast('下单失败');
      }
    });
  }
})