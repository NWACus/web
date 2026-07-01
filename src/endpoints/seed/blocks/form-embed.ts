import { RequiredDataFromCollectionSlug } from 'payload'

export const formEmbed: RequiredDataFromCollectionSlug<'pages'>['layout'] = [
  {
    blockType: 'formEmbed',
    html: '<script src="https://donorbox.org/widget.js" paypalExpress="false"></script><iframe src="https://donorbox.org/embed/example-campaign" name="donorbox" allowpaymentrequest="allowpaymentrequest" seamless="seamless" frameborder="0" scrolling="no" height="900px" width="100%" style="max-width: 500px; min-width: 250px; max-height:none!important"></iframe>',
    backgroundColor: 'transparent',
    alignContent: 'center',
  },
]
