import type React from 'react'
import { createPortal } from 'react-dom'
import ChannelIcon from '@/pages/channel/[channelId]/_channel_icons/ChannelIcon.ts'

const ChannelSvgSymbols: React.FC = () => {
  return createPortal(
    <svg className="hidden">
      <defs>
        {/*<!-- Copyright 2000-2021 JetBrains s.r.o. Use of this source code is governed by the Apache 2.0 license that can be found in the LICENSE file. -->*/}
        <svg
          id={ChannelIcon.JAVA}
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 16 16"
        >
          <g fill="none" fill-rule="evenodd">
            <polygon
              fill="#40B6E0"
              fill-opacity=".7"
              points="1 16 16 16 16 9 1 9"
            />
            <polygon fill="#9AA7B0" fill-opacity=".8" points="7 1 3 5 7 5" />
            <polygon
              fill="#9AA7B0"
              fill-opacity=".8"
              points="8 1 8 6 3 6 3 8 13 8 13 1"
            />
            <path
              fill="#231F20"
              fill-opacity=".7"
              d="M1.39509277,3.58770752 C1.62440186,3.83789062 1.83782861,4 2.28682861,4 C2.81318359,4 3,3.58770752 3,3.29760742 L3,0 L4,0 L4,3.58770752 C4,4.31964111 3.32670898,5 2.45,5 C1.629,5 1.15,4.76264111 0.8,4.31964111 L1.39509277,3.58770752 Z"
              transform="translate(2 10)"
            />
          </g>
        </svg>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 640 640"
          id={ChannelIcon.TERMINAL}
        >
          {/*<!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.-->*/}
          <path
            fill="currentColor"
            d="M73.4 182.6C60.9 170.1 60.9 149.8 73.4 137.3C85.9 124.8 106.2 124.8 118.7 137.3L278.7 297.3C291.2 309.8 291.2 330.1 278.7 342.6L118.7 502.6C106.2 515.1 85.9 515.1 73.4 502.6C60.9 490.1 60.9 469.8 73.4 457.3L210.7 320L73.4 182.6zM288 448L544 448C561.7 448 576 462.3 576 480C576 497.7 561.7 512 544 512L288 512C270.3 512 256 497.7 256 480C256 462.3 270.3 448 288 448z"
          />
        </svg>
      </defs>
    </svg>,
    document.body,
  )
}

export default ChannelSvgSymbols
