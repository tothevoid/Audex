import React from 'react';
import { Flex, FlexProps } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { AppIcon } from '@/shared/components/AppIcon';

const pulseAnimation = keyframes`
  0% {
    transform: scale(0.92);
    opacity: 0.65;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
  100% {
    transform: scale(0.92);
    opacity: 0.65;
  }
`;

export interface AppLoaderProps extends FlexProps {
	size?: string | number;
	fullscreen?: boolean;
	iconColor?: string;
}

export const AppLoader: React.FC<AppLoaderProps> = ({
	size = '64px',
	fullscreen = true,
	iconColor = 'text_primary',
	...restFlexProps
}) => {
	return (
		<Flex
			minH={fullscreen ? '100vh' : '100%'}
			w={fullscreen ? '100vw' : '100%'}
			align="center"
			justify="center"
			backgroundColor="background_main"
			direction="column"
			gap={4}
			{...restFlexProps}
		>
			<AppIcon
				size={size}
				color={iconColor}
				animation={`${pulseAnimation} 1.8s ease-in-out infinite`}
				willChange="transform, opacity"
			/>
		</Flex>
	);
};

export default AppLoader;
