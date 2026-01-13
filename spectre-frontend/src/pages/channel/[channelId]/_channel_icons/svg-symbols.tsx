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
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" id={ChannelIcon.HASH}>
          {/*<!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.-->*/}
          <path fill="currentColor" d="M278.7 64.7C296 68.4 307 85.4 303.3 102.7L284.2 192L410.7 192L432.7 89.3C436.4 72 453.4 61 470.7 64.7C488 68.4 499 85.4 495.3 102.7L476.2 192L544 192C561.7 192 576 206.3 576 224C576 241.7 561.7 256 544 256L462.4 256L435 384L502.8 384C520.5 384 534.8 398.3 534.8 416C534.8 433.7 520.5 448 502.8 448L421.2 448L399.2 550.7C395.5 568 378.5 579 361.2 575.3C343.9 571.6 332.9 554.6 336.6 537.3L355.7 448L229.2 448L207.2 550.7C203.5 568 186.5 579 169.2 575.3C151.9 571.6 140.9 554.6 144.6 537.3L163.8 448L96 448C78.3 448 64 433.7 64 416C64 398.3 78.3 384 96 384L177.6 384L205 256L137.2 256C119.5 256 105.2 241.7 105.2 224C105.2 206.3 119.5 192 137.2 192L218.8 192L240.8 89.3C244.4 72 261.4 61 278.7 64.7zM270.4 256L243 384L369.5 384L396.9 256L270.4 256z"/>
        </svg>
      </defs>
    </svg>,
    document.body,
  )
}

export default ChannelSvgSymbols
