#version 410

// based off https://glslsandbox.com/e#77888.0

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

out vec4 retColor;

uniform float uFreq;
uniform float uTime;
uniform float uLastFreq;
uniform float uDeltaFreq;
uniform float[256] uSpectrum;
uniform vec2 uRes;

#define saturate(x) clamp(x, 0.0, 1.0)

float sinc(float x)
{
	return sin(x) / x;
}

float cosc(float x)
{
	return cos(x) / x;
}

mat2 rot(float a)
{
	mat2 ret = mat2(
		cos(a), sin(a),
		-sin(a), cos(a)
	);

	return ret;
}

vec3 hsv2rgb(float h, float s, float v)
{
	return ((clamp(abs(fract(h + vec3(0.0, 2.0, 1.0) / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0) - 1.0) * s + 1.0) * v;
}

float noise(vec2 p)
{
	return sin(-p.x * 3.0 + p.y * 10.0);
}

float sdBox(vec3 p, vec3 b)
{
	vec3 q = abs(p) - b;
	return length(max(q, 0.0)) + min(0.0, max(q.x, max(q.y, q.z)));
}

void U(inout vec4 m, float d, float a, float b, float c)
{
	if (d < m.x) m = vec4(d, a, b, c);
}

vec4 map(vec3 p, float f)
{
	vec3 q = p;
	p = mod(p, 1.0) - 0.5;
	vec4 m = vec4(1.0);
	float af = atan(uFreq, f);

	float s = 1.0;
	for (int i = 0; i < 5; i++)
	{
		p = abs(p) - 0.5;
		p.xy *= rot(-0.5);
//p = abs(p) - 0.4 + 0.0 * cos(TAU * uTime / 4.0);
		p = abs(p) - 0.4 + 0.0 * cos(TAU / af);

//p.yz *= rot(-0.1);
		p.yz *= rot(-0.05 * af * cos(uTime * 0.025));

		p *= 1.4;
		s *= 1.4;
	}

	float a = 0.5;
	float b = 0.05;
	float c = 0.05;

	a = 0.85;
	c = mod(uDeltaFreq, f) + min(af, 0.5);

//U(m, sdBox(p, vec3(0.5, 0.05, 0.05)) / s, 1.0, 1.0, 0.0);
	U(m, sdBox(p, vec3(a, b, c)) / s, 1.0, 1.0, 0.0);

	a = 0.5 + 0.5 * cosc(TAU * uTime / 4.0);
	b = 0.08 * sin(af);
	c = 0.05 + sinc(af);

//U(m, sdBox(p, vec3(0.5 + 0.5 * (cos(TAU * uTime / 4.0)), 0.06, 0.05)) / s, 0.0, 0.1, 0.5);
	U(m, sdBox(p, vec3(a, b, c)) / s, 0.0, 0.1, abs(0.5 - f));

	a = 0.9;
	b = 0.3;
	c = 0.5 * noise(p.yz * af);

	float sd = cos(TAU * ((uTime / f) + q.z / 8.0));

U(m, sdBox(p, vec3(0.2, 0.6, 0.1)) / s, 0.0, saturate(cos(TAU * (uTime + q.z / 8.0))), -0.5);
//	U(m, sdBox(p, vec3(a, b, c)) / s, 0.0, saturate(sd), -0.5);

	return m;
}

vec3 fbm(vec3 p)
{
	return sin(p) + sin(p * 2.0) / 2.0 + sin(p * 4.0) / 4.0;
}

vec3 col(vec2 p)
{
	vec3 ret;
	vec3 c = vec3(0.0);

	p *= rot(uTime * 0.75);

	float x = mod(uFreq * 4.0, 1.0);
	float f = cos((sin(cos(x)) - sin(x) - x) + x * x);
	vec3 vf = vec3(
		uSpectrum[31] / f,
		uSpectrum[63] - f,
		uSpectrum[127] * f
	) + uSpectrum[254];
	float t = uTime * 0.25;
	float tf = t * atan(f, length(vf));

	vec2 m;
	m.x = atan(p.x / p.y) / PI;
	m.y = 1.0 / length(p) * 0.2;



//vec3 ro = vec3(0.0, 0.0, uTime);
	vec3 ro = vec3(0.0, 0.0, (uTime * 0.2));
//vec3 ray = vec3(p, 1.1 + cos(TAU * uTime / 8.0));
	vec3 ray = vec3(p, 1.1 + cos(TAU * (tf) / 64.0));
//ray += 0.1 * fbm(vec3(1.0, 2.0, 3.0) + TAU * uTime / 4.0);
	ray += 0.1 * fbm(vec3(1.0, 2.0, 3.0) + TAU * (uTime * 0.1) / 4.0);
	ray = normalize(ray);

	float u = uFreq;
	for (int i = 0; i < 100; i++)
	{
		vec3 q = ro + ray * u;
//vec4 m = map(q, 1.0);
		vec4 m = map(q, sin(length(cross(c, vf))));
		float d = m.x;
		if (m.y == 1.0)
		{
			u += d;
			if (d < 0.001)
			{
//c += 0.005 * float(i);
				c += 0.05 * float(i) * atan(f, length(vf)) - cross(vf, c);
				break;
			}
		}
		else
		{
//u += abs(d) * 0.5 + 0.01;
			u += abs(d) * 0.5 + 0.01 * length(vf);
			c += saturate(0.001 * vec3(1.0 + m.w, 1.0, 1.0 - m.w) * m.z / abs(d));
		}
	}

	c = mix(vec3(0.0), c, exp(-0.7 * u));

	/*
	float a1 = 1.0;
	float a2 = cosc(tf);
	float a3 = -sin(uFreq);

	float b1 = -sinc(tf);
	float b2 = 1.0;
	float b3 = cos(tf);

	float c1 = sin(tf);
	float c2 = -cosc(tf);
	float c3 = 1.0;

	c *= mat3(
		a1, a2, a3,
		b1, b2, b3,
		c1, c2, c3
	);
	*/

	//c = vec3(1.0, 0.0, 0.0);
	//c = vec3(0.0, 1.0, 0.0);
	//c = vec3(0.0, 0.0, 1.0);

	ret = uFreq > 0.0005 ? c : vec3(0.0);

	return ret;
}

void main() 
{
	vec2 uv;
	uv = (gl_FragCoord.xy - 0.5 - uRes) / min(uRes.x, uRes.y);
	vec4 ret;

	ret = vec4(col(uv), 1.0);
	retColor = ret;

}