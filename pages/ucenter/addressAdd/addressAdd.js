var util = require('../../../utils/util.js');
var api = require('../../../config/api.js');
// 引入SDK核心类
var QQMapWX = require('../../../utils/qqmap-wx-jssdk.min.js');
var app = getApp();
Page({
  data: {
    address: {
      id:0,
      province_id: 11,
      city_id: 114,
      district_id: 4044,
      address: '',
      full_region: '',
      name: '',
      mobile: '',
      is_default: 0
    },
    addressId: 0,
    openSelectRegion: false,
    selectRegionList: [
      { id: 11, name: '省份', parent_id: 1, type: 1 },
      { id: 114, name: '城市', parent_id: 1, type: 2 },
      { id: 4044, name: '区县', parent_id: 1, type: 3 }
    ],
    regionType: 1,
    regionList: [],
    selectRegionDone: false,
    tips: []
  },
  bindinputMobile(event) {
    let address = this.data.address;
    address.mobile = event.detail.value;
    this.setData({
      address: address
    });
  },
  bindinputName(event) {
    let address = this.data.address;
    address.name = event.detail.value;
    this.setData({
      address: address
    });
  },
  bindinputAddress (event){
    // let address = this.data.address;
    // address.address = event.detail.value;
    // this.setData({
    //   address: address
    // });

    var that = this;
    var keywords = event.detail.value; 

    // 实例化API核心类
    var qqmapsdk = new QQMapWX({
      key: 'WWVBZ-V4W6P-OVRD2-VYQFN-FHKOO-SWFP3' // 必填
    });
    var _this = this;
    //调用关键词提示接口
    qqmapsdk.getSuggestion({
      //获取输入框值并设置keyword参数
      keyword: `江苏省苏州市昆山市${keywords}`, //用户输入的关键词，可设置固定值,如keyword:'KFC'
      region:'苏州市', //设置城市名，限制关键词所示的地域范围，非必填参数
      success: function(res) {//搜索成功后的回调
        var sug = [];
        for (var i = 0; i < res.data.length; i++) {
          sug.push({ // 获取返回结果，放到sug数组中
            name: res.data[i].title,
            id: res.data[i].id,
            addr: res.data[i].address,
            city: res.data[i].city,
            district: res.data[i].district,
            latitude: res.data[i].location.lat,
            longitude: res.data[i].location.lng
          });
        }
        console.log(sug);

        _this.setData({ //设置suggestion属性，将关键词搜索结果以列表形式展示
          tips: sug
        });
      },
      fail: function(error) {
        console.error(error);
      },
      complete: function(res) {
        console.log(res);
      }
    });
    // myAmapFun.getInputtips({
    //   keywords: `江苏省苏州市昆山市${keywords}`,
    //   location: lonlat,
    //   city: '苏州市',
    //   citylimit: true,
    //   success: function(data){
    //     if(data && data.tips){
    //       that.setData({
    //         tips: data.tips
    //       });
    //     }
    //   }
    // })
  },
  bindSearch: function(e){
    let address = this.data.address;
    address.address = e.target.dataset.keywords;
    this.setData({
      address: address
    }, () => {
      this.setData({
        tips: []
      })
    });
  },
  bindIsDefault(){
    let address = this.data.address;
    address.is_default = !address.is_default;
    this.setData({
      address: address
    });
  },
  getAddressDetail() {
    let that = this;
    util.request(api.AddressDetail, { id: that.data.addressId }).then(function (res) {
      if (res.errno === 0) {
        that.setData({
          address: res.data
        });
      }
    });
  },
  setRegionDoneStatus() {
    let that = this;
    let doneStatus = that.data.selectRegionList.every(item => {
      return item.id != 0;
    });

    that.setData({
      selectRegionDone: doneStatus
    })

  },
  chooseRegion() {
    let that = this;
    this.setData({
      openSelectRegion: !this.data.openSelectRegion
    });

    //设置区域选择数据
    let address = this.data.address;
    if (address.province_id > 0 && address.city_id > 0 && address.district_id > 0) {
      let selectRegionList = this.data.selectRegionList;
      selectRegionList[0].id = address.province_id;
      selectRegionList[0].name = address.province_name;
      selectRegionList[0].parent_id = 1;

      selectRegionList[1].id = address.city_id;
      selectRegionList[1].name = address.city_name;
      selectRegionList[1].parent_id = address.province_id;

      selectRegionList[2].id = address.district_id;
      selectRegionList[2].name = address.district_name;
      selectRegionList[2].parent_id = address.city_id;

      this.setData({
        selectRegionList: selectRegionList,
        regionType: 3
      });

      this.getRegionList(address.city_id);
    } else {
      this.setData({
        selectRegionList: [
          { id: 0, name: '省份', parent_id: 1, type: 1 },
          { id: 0, name: '城市', parent_id: 1, type: 2 },
          { id: 0, name: '区县', parent_id: 1, type: 3 }
        ],
        regionType: 1
      })
      this.getRegionList(1);
    }

    this.setRegionDoneStatus();

  },
  onLoad: function (options) {
    // 页面初始化 options为页面跳转所带来的参数
    console.log(options)
    if (options.id) {
      this.setData({
        addressId: options.id
      });
      this.getAddressDetail();
    }

    this.getRegionList(1);
  },
  onReady: function () {

  },
  selectRegionType(event) {
    let that = this;
    let regionTypeIndex = event.target.dataset.regionTypeIndex;
    let selectRegionList = that.data.selectRegionList;

    //判断是否可点击
    if (regionTypeIndex + 1 == this.data.regionType || (regionTypeIndex - 1 >= 0 && selectRegionList[regionTypeIndex-1].id <= 0)) {
      return false;
    }

    this.setData({
      regionType: regionTypeIndex + 1
    })
    
    let selectRegionItem = selectRegionList[regionTypeIndex];

    this.getRegionList(selectRegionItem.parent_id);

    this.setRegionDoneStatus();

  },
  selectRegion(event) {
    let that = this;
    let regionIndex = event.target.dataset.regionIndex;
    let regionItem = this.data.regionList[regionIndex];
    let regionType = regionItem.type;
    let selectRegionList = this.data.selectRegionList;
    selectRegionList[regionType - 1] = regionItem;


    if (regionType != 3) {
      this.setData({
        selectRegionList: selectRegionList,
        regionType: regionType + 1
      })
      this.getRegionList(regionItem.id);
    } else {
      this.setData({
        selectRegionList: selectRegionList
      })
    }

    //重置下级区域为空
    selectRegionList.map((item, index) => {
      if (index > regionType - 1) {
        item.id = 0;
        item.name = index == 1 ? '城市' : '区县';
        item.parent_id = 0;
      }
      return item;
    });

    this.setData({
      selectRegionList: selectRegionList
    })


    that.setData({
      regionList: that.data.regionList.map(item => {

        //标记已选择的
        if (that.data.regionType == item.type && that.data.selectRegionList[that.data.regionType - 1].id == item.id) {
          item.selected = true;
        } else {
          item.selected = false;
        }

        return item;
      })
    });

    this.setRegionDoneStatus();

  },
  doneSelectRegion() {
    if (this.data.selectRegionDone === false) {
      return false;
    }

    let address = this.data.address;
    let selectRegionList = this.data.selectRegionList;
    address.province_id = selectRegionList[0].id;
    address.city_id = selectRegionList[1].id;
    address.district_id = selectRegionList[2].id;
    address.province_name = selectRegionList[0].name;
    address.city_name = selectRegionList[1].name;
    address.district_name = selectRegionList[2].name;
    address.full_region = selectRegionList.map(item => {
      return item.name;
    }).join('');

    this.setData({
      address: address,
      openSelectRegion: false
    });

  },
  cancelSelectRegion() {
    this.setData({
      openSelectRegion: false,
      regionType: this.data.regionDoneStatus ? 3 : 1
    });

  },
  getRegionList(regionId) {
    let that = this;
    let regionType = that.data.regionType;
    util.request(api.RegionList, { parentId: regionId }).then(function (res) {
      if (res.errno === 0) {
        that.setData({
          regionList: res.data.map(item => {

            //标记已选择的
            if (regionType == item.type && that.data.selectRegionList[regionType - 1].id == item.id) {
              item.selected = true;
            } else {
              item.selected = false;
            }

            return item;
          })
        });
      }
    });
  },
  cancelAddress(){
    wx.reLaunch({
      url: '/pages/shopping/address/address',
    })
  },
  saveAddress(){
    console.log(this.data.address)
    let address = this.data.address;

    if (address.name == '') {
      util.showErrorToast('请输入姓名');

      return false;
    }

    if (address.mobile == '') {
      util.showErrorToast('请输入手机号码');
      return false;
    }


    if (address.district_id == 0) {
      util.showErrorToast('请输入省市区');
      return false;
    }

    if (address.address == '') {
      util.showErrorToast('请输入详细地址');
      return false;
    }


    let that = this;
    util.request(api.AddressSave, { 
      id: address.id,
      name: address.name,
      mobile: address.mobile,
      // province_id: address.province_id,
      // city_id: address.city_id,
      // district_id: address.district_id,
      province_id: 11,
      city_id: 114,
      district_id: 4044,
      address: address.address,
      is_default: address.is_default,
    }, 'POST').then(function (res) {
      if (res.errno === 0) {
        wx.reLaunch({
          url: '/pages/shopping/address/address',
        })
      }
    });

  },
  onShow: function () {
    // 页面显示

  },
  onHide: function () {
    // 页面隐藏

  },
  onUnload: function () {
    // 页面关闭

  }
})